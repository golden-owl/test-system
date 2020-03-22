from django import forms

class QuestionChoiceForm(forms.ModelForm):
    class Meta:
        widgets = {
            'text': forms.TextInput(attrs={'size': 180}),
            'is_correct': forms.CheckboxInput()
        }