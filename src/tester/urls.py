
from django.contrib import admin
from django.urls import path

from . import views

app_name = 'tester'

urlpatterns = [
    path('', views.TestPageView.as_view(), name="test"),
]
