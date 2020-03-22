from django.shortcuts import render
from . import models

from django.views.generic import TemplateView, DetailView, ListView

class TestPageView(TemplateView):
    template_name = 'tester/test.html'

class TestDetailView(DetailView):
    model = models.TestInstance
    context_object_name = 'test'

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['category'] = models.TestCategory.objects.get(slug=self.kwargs['category_slug'])
        context['questions'] = self.get_object().questions.all()
        return context

class CategoriesView(ListView):
    template_name = 'tester/categories.html'
    context_object_name = 'categories'

    def get_queryset(self):
        return models.TestCategory.objects.all()


class TestByCategoryView(ListView):
    template_name = 'tester/by_category.html'
    context_object_name = 'tests'

    def get_queryset(self):
        return models.TestInstance.objects.filter(category__slug=self.kwargs['category_slug'])

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['category'] = models.TestCategory.objects.get(slug=self.kwargs['category_slug'])
        return context


