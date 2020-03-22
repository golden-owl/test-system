
from django.contrib import admin
from django.urls import path

from . import views

app_name = 'tester'

urlpatterns = [
    path('categories/', views.CategoriesView.as_view(), name="categories"),
    path('<slug:category_slug>/', views.TestByCategoryView.as_view(), name="category"),
    path('<slug:category_slug>/<int:pk>/', views.TestDetailView.as_view(), name="test"),
]
