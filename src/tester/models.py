from django.db import models
from django.core import exceptions
from django.core.exceptions import ValidationError, NON_FIELD_ERRORS
from django.urls import reverse
from pytils.translit import slugify
from django.utils.translation import gettext_lazy as _

class TestCategory(models.Model):
    name = models.CharField(_('Название категории'), max_length=150, unique=True)
    slug = models.SlugField(_('Имя в ссылке'), max_length=150, unique=True)

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('tester:test', kwargs={"pk": self.pk})

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Категория тестов'
        verbose_name_plural = 'Категории тестов'
        ordering = ['name']


class TestInstance(models.Model):
    name = models.CharField(_('Тема'), max_length=150)
    description = models.TextField(_('Описание'), blank=True)
    category = models.ForeignKey(TestCategory,
        verbose_name='Категория',
        on_delete=models.CASCADE,
        related_name='tests',
        related_query_name='test',
    )

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('tester:test', kwargs={"pk": self.pk})

    class Meta:
        verbose_name = 'Тест'
        verbose_name_plural = 'Тесты'
        ordering = ['category', 'name']


class Question(models.Model):
    class QuestionType(models.TextChoices):
        FREE_ANSWER = 'FA', _('Свободный ответ')
        ONE_ANSWER = 'OA', _('Один вариант ответа')
        MANY_ANSWERS = 'MA', _('Несколько вариантов ответа')

    description = models.CharField(_('Описание'), max_length=150, blank=True)
    image = models.ImageField(
        _('Картинка'),
        upload_to='img/question_images',
        height_field=None, width_field=None,
        max_length=None,
        blank=True, null=True
    )
    text = models.TextField(_('Текст вопроса'), blank=True)
    test_instance = models.ForeignKey(TestInstance, on_delete=models.CASCADE,
        related_name='questions',
        related_query_name='question',
        verbose_name='Тест',
    )
    number = models.IntegerField(_('Номер'), default=-1, editable=False)
    cost = models.IntegerField(_('Стоимость'), default=0)

    def qtype(self):
        correct_answers = self.choices.filter(is_correct=True).count()
        if correct_answers == 0:
            return 'FA'
        if correct_answers == 1:
            return 'OA'
        return 'MA'
    qtype.short_description = 'Тип вопроса'

    def save(self, *args, **kwargs):
        if self.number == -1:
            self.number = self.test_instance.questions.count() + 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        for question in self.test_instance.questions.filter(number__gt=self.number):
            question.number -= 1
            question.save()
            print(question.number)
        super().delete(*args, **kwargs)

    def __str__(self):
        return '%s, Вопрос № %s' % (self.test_instance.name, self.number)

    class Meta:
        verbose_name = 'Вопрос'
        verbose_name_plural = 'Вопросы'
        ordering = ['test_instance', 'pk']


class QuestionChoice(models.Model):
    text = models.CharField(_('Текст'), max_length=120)
    is_correct = models.BooleanField(_('Правильный'))
    question = models.ForeignKey(Question, on_delete=models.CASCADE,
        related_name='choices',
        related_query_name='choice',
    )
    class Meta:
        verbose_name = 'Вариант ответа'
        verbose_name_plural = 'Варианты ответа'