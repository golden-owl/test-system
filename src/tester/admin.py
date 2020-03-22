from django.contrib import admin
from django.db.models import CharField
from django import forms
from . import models

@admin.register(models.TestCategory)
class TestCategoryAdmin(admin.ModelAdmin):
    list_display = ( '__str__', 'name', 'slug', )
    list_editable = ( 'name', )
    search_fields = ( 'name', )
    # readonly_fields = ( 'slug', )
    prepopulated_fields = {
        'slug': ( 'name', ),
    }
    formfield_overrides = {
        CharField: {
            'widget': forms.TextInput(attrs={ 'size': '120' })
        }
    }
    pass

@admin.register(models.TestInstance)
class TestInstanceAdmin(admin.ModelAdmin):
    list_display = ( 'name', 'category' )
    # list_editable = ( 'name', 'category', )
    # search_fields = ( 'name', )

    fields = ( 'category', 'name', 'description' )
    search_fields = ( 'name', )
    autocomplete_fields = ( 'category', )

    formfield_overrides = {
        CharField: {
            'widget': forms.TextInput(attrs={ 'size': '120' })
        }
    }
    pass


class QuetionChoiceInline(admin.StackedInline):
    model = models.QuestionChoice
    fieldsets = (
        (None, {
            'fields': ( ( 'text', 'is_correct', ), ),
            'classes': ( 'wide', ),
        }),
    )
    extra = 0
    formfield_overrides = {
        CharField: {
            'widget': forms.TextInput(attrs={ 'size': '120' })
        }
    }


@admin.register(models.Question)
class QuestionAdmin(admin.ModelAdmin):
    inlines = [QuetionChoiceInline]
    autocomplete_fields = ( 'test_instance', )
    list_filter = ( 'test_instance', )
    list_display = ( '__str__', 'description', 'test_instance', 'qtype')
    
    formfield_overrides = {
        CharField: {
            'widget': forms.TextInput(attrs={ 'size': '120' })
        }
    }

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ( 'number', )
        return ()

    def get_fields(self, request, obj=None):
        flds = [
            'test_instance',
            'description',
            'text',
            'image',
            'cost',
        ]
        if obj:
            flds.insert(1, 'number')
        return flds
    pass
