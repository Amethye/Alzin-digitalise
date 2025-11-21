from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.

from django . urls import reverse_lazy
from django . views . generic import CreateView , DeleteView , UpdateView , ListView
from gui . models import Client , Commande