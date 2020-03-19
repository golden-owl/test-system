from django.shortcuts import render

# Create your views here.
from django.views.generic import TemplateView

class TestPageView(TemplateView):
    template_name = "tester/test.html"