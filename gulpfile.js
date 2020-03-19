"use strict";

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

let gulp = require('gulp');
let notify = require('gulp-notify');

let path = require('path');
let browserSync = require('browser-sync').create();
let webpackStream = require('webpack-stream');
let combine = require('stream-combiner2').obj;

let sass = require('gulp-sass');
let cssimport = require('gulp-cssimport');
let postcss = require('gulp-postcss');
let autoprefixer = require('autoprefixer');
let qcmq = require('gulp-group-css-media-queries');
let cleancss = require('gulp-clean-css');

let gulpIf = require('gulp-if');
let rev = require('gulp-rev')
let revReplace = require('gulp-rev-replace')
let sourcemaps = require('gulp-sourcemaps')

let del = require('del');

let webpackConfig = require(`./webpack/webpack.${isDevelopment ? 'dev' : 'prod'}.js`);

let spawn = require('child_process').spawn;
let argv = require('yargs')
	.default('host', '127.0.0.1')
	.default('port', 3000)
	.default('bsync-port', 8000)
	.argv;
const djangoAddress = argv.host + ":" + argv.port;
let config = {
	sass: {
		src: [
			'./assets/styles/*.scss',
		],
		watch: './assets/styles/**/*.scss',
		directories: [],
		sassOptions: {
			includePaths: ['node_modules']
		}
	},
	js: {
		src: './assets/js/*.js',
		// Сюда добавлять путь к js файлам, которые необходимо собрать
		entry: {
			tester_main: './assets/js/tester_main.js',
		},
		watch: './assets/js/**/*.js',
		directories: [],
	},
	django: {
		apps: [
			'tester',
			'mainpage',
		],
		project: 'test_system',
		root: './src',
		templates: 'templates',
	},
	manifests: './manifests',
	buildDir: './build',
};

const getAssetDestPath = (file, opt) => {
	const name = file.basename;
	const ext = name.substring(name.indexOf('.') + 1);
	const django_app = name.substring(0, name.indexOf('_'));
	const destPath = `${config.django.root}/${django_app}/static/${ext}`;
	if (ext == 'js' ) {
		return destPath;
	}
	return isDevelopment
		? destPath
		: `${config.buildDir}/${path.relative(config.django.root, destPath)}`;
}

function getDestPath(file) {
	return `${config.buildDir}/${path.relative(config.django.root, file.base)}`;
};


for (const app of config.django.apps) {
	config.sass.directories.push(`${config.django.root}/${app}/static/css`)
	config.js.directories.push(`${config.django.root}/${app}/static/js`)
}


gulp.task('del', function() {
	return del(config.buildDir);
})


gulp.task('jsWebpack', function () {
	del(config.js.directories);
	let cfg = Object.assign({}, webpackConfig, {
		entry: config.js.entry
	});

	return gulp.src(config.js.src)
		.pipe(webpackStream(cfg))
		.on('error', function (error) {
			console.log(error.message);
			this.emit('end');
		})
		.pipe(gulp.dest(getAssetDestPath))
});

gulp.task('collectJs', function() {
	let src = config.django.apps.map(app => `./${config.django.root}/${app}/static/js/**/*`);
	return combine(
		gulp.src(src),
		revReplace({
			manifest: gulp.src([
				`${config.manifests}/img.json`,
				`${config.manifests}/fonts.json`,
				`${config.manifests}/css.json`,
			], { allowEmpty: true })
		}),
		rev(),
		gulp.dest(getDestPath),
		combine(
			rev.manifest('js.json'),
			gulp.dest(config.manifests)
		)
	).on('error', notify.onError());
})

gulp.task('styles', function() {
	del(config.sass.directories);
	return combine(
		gulp.src(config.sass.src),
		gulpIf(isDevelopment, sourcemaps.init()),
		sass({
      includePaths: [path.join(__dirname, 'node_modules')]
		}),
		cssimport({}),
    postcss([ autoprefixer() ]),
		qcmq(),
		gulpIf(isDevelopment, sourcemaps.write()),
		gulpIf(!isDevelopment, combine(
			revReplace({
				manifest: gulp.src([
					`${config.manifests}/img.json`,
					`${config.manifests}/fonts.json`,
				], { allowEmpty: true })
			}),
			cleancss({ compatibility: 'ie9' }),
			rev()
		)),
		gulp.dest(getAssetDestPath),
		gulpIf(!isDevelopment, combine(
			rev.manifest('css.json'),
			gulp.dest(config.manifests)
		)),
		browserSync.stream(),
	)
})

gulp.task('django-runserver', function () {
	if (!process.env['VIRTUAL_ENV']) {
		console.warn("WARNING: To run django you should activate virtual environment")
	} else {
		let args = ["../src/manage.py", "runserver", djangoAddress];
		let python = process.env['VIRTUAL_ENV'] + '/Scripts/python';
		let runserver = spawn(python, args, {
			stdio: "inherit",
			cwd: 'venv'
		});
		runserver.on('close', function (code) {
			if (code !== 0) {
				console.error('Django runserver exited with error code: ' + code);
			} else {
				console.log('Django runserver exited normally.');
			}
		});
	}
});

gulp.task('img', function() {
	let src = config.django.apps.map(app => `./${config.django.root}/${app}/static/img/**/*`);
	src.push(`./${config.django.root}/media/img/**/*`);
	return combine(
		gulp.src(src),
		rev(),
		gulp.dest(getDestPath),
		combine(
			rev.manifest('img.json'),
			gulp.dest(config.manifests)
		)
	).on('error', notify.onError())
});

gulp.task('html', function() {
	let src = config.django.apps.map(app => `./${config.django.root}/${app}/templates/**/*`);
	src.push(`${config.django.root}/${config.django.templates}/**/*`);

	return combine(
		gulp.src(src),
		revReplace({
			manifest: gulp.src([
				'./manifests/css.json',
				'./manifests/js.json',
				'./manifests/img.json',
				'./manifests/scripts.json',
			], { allowEmpty: true })
		}),
		gulp.dest(getDestPath),
	).on('error', notify.onError())
})

gulp.task('fonts', function() {
	let src = config.django.apps.map(app => `./${config.django.root}/${app}/static/fonts/**/*`);
	return combine(
		gulp.src(src),
		rev(),
		gulp.dest(getDestPath),
		combine(
			rev.manifest('fonts.json'),
			gulp.dest(config.manifests)
		)
	).on('error', notify.onError())
});

gulp.task('collectMedia', function() {
	return combine(
		gulp.src(`${config.django.root}/media`),
		gulp.dest(getDestPath),
		gulp.dest(config.manifests),
	).on('error', notify.onError())
});

gulp.task('collectDjango', function() {
	let src = config.django.apps.map(app => `./${config.django.root}/${app}/**/*.py`);
	src.push(`${config.django.root}/manage.py`);
	src.push(`${config.django.root}/requirements.txt`);
	src.push(`${config.django.root}/db.sqlite3`);
	return combine(
		gulp.src(src),
		gulp.dest(getDestPath),
	).on('error', notify.onError())
});


gulp.task('browsersync', function () {
	browserSync.init({
		cwd: 'src',
		proxy: {
			target: djangoAddress,
		},
		port: argv['bsync-port'],
		open: false,
	});
	let watchDirs = [
		`assets/js/**/*.js`,
		`./src/${config.django.project}/**/*.py`,
		`./src/templates/**/*.html`,
	];
	for (const app of config.django.apps) {
		watchDirs.push(`./src/${app}/templates/**/*.html`);
		watchDirs.push(`./src/${app}/**/*.py`);
	}

	browserSync.watch(watchDirs).on('change', gulp.series(browserSync.reload, 'styles'));
	gulp.watch(config.sass.watch, gulp.series('styles'));
});

gulp.task('default', gulp.parallel(
	'styles',
	'jsWebpack',
	'django-runserver',
	'browsersync',
));

gulp.task('build', gulp.series(
	'del',
	'img',
	'fonts',
	'styles',
	'jsWebpack',
	'collectJs',
	'collectMedia',
	'collectDjango',
	'html',
));

// python src/manage.py dumpdata --exclude auth.permission --exclude contenttypes    --indent 4 > dump.json

