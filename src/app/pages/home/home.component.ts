import { Component, signal, effect, inject, Injector, computed, ViewChild, ElementRef, HostListener } from '@angular/core';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { Task } from 'src/app/models/tasks.model';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLinkWithHref],
  templateUrl: './home.component.html',
})
export class HomeComponent {

  constructor(private route: ActivatedRoute, private router: Router) {}
  
  tasks = signal<Task[]>([])
  injector = inject(Injector)

  // This allows to filter tasks by All | Pending | Completed
  filter = signal<'all' | 'pending' | 'completed'>('all');

  
  ngOnInit() {
    const storage = localStorage.getItem('mydayapp-angular')
    if (storage) {
      const tasks = JSON.parse(storage)
      this.tasks.set(tasks)
    }
    this.trackTasks()

    //Used to fetch the QueryParam to update Tasks by Filter
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments[0].path as 'all' | 'pending' | 'completed';
      this.filter.set(path)
  });
  }
  
  trackTasks() {
    effect(() => {
      const tasks = this.tasks()
      localStorage.setItem('mydayapp-angular', JSON.stringify(tasks))
    }, { injector: this.injector})
  } 

  
  newTaskCtrl = new FormControl('' , {
  nonNullable: true,
  validators: [
    Validators.required,
    Validators.minLength(3)
  ]
  })
  
  //Computed
  totalTasks = computed(() => {
    const tasks = this.tasks()
    return tasks.length
  })

  tasksLeft = computed (() => {
    const tasks = this.tasks();
    return tasks.filter(task => !task.completed).length
  })

  tasksCompleted = computed (() => {
    const tasks = this.tasks();
    return tasks.filter(task => task.completed).length
  })

  tasksByFilter = computed(() => {
    const filter = this.filter();
    const tasks = this.tasks();
    if (filter === 'pending') {
      return tasks.filter(task => !task.completed);
    }
    if (filter === 'completed') {
      return tasks.filter(task => task.completed);
    }
    return tasks;
  })
    
  changeAddHandler() {
    if (this.newTaskCtrl.valid) {
      //trim() elimina espacios al inicio y al final
      const value = this.newTaskCtrl.value.trim();
      if (value !== '') {
        this.addTask(value)
        this.newTaskCtrl.setValue('');
      }
    }
  }

  addTask(title: string) {
    const newTask = {
      id: Date.now(),
      title,
      completed: false,
    };
    this.tasks.update((tasks) => [...tasks, newTask]);
  }

  deleteTask(index: number) {
    this.tasks.update((tasks) =>
      tasks.filter((task, position) =>
        position!== index))
  }

  updateTask(index: number) {
    this.tasks.update((tasks) => {
      return tasks.map((task, position) => {
        if (position === index) {
          return {
            ...task,
            completed: !task.completed
          }
        }
        return task;
      })
    })
  }

  @ViewChild('editingInput') inputElement!: ElementRef

  enterTaskEditingMode(index: number) {
    this.tasks.update((prevState) => {
      return prevState.map((task, position) => {
        if (position === index) {
          return {
            ...task,
            editing: true
          };
        }
        return {
          ...task,
          editing: false
        };
      });
    });
    setTimeout(() => {
      this.newTaskCtrl.setValue('');
      this.inputElement.nativeElement.focus()
  }, 0);
  } 

  // HostListener para capturar eventos de clic y tecla
  @HostListener('document:click', ['$event'])
  handleClick(event: Event) {
    if (this.inputElement && !this.inputElement.nativeElement.contains(event.target)) {
      this.leaveTaskEditingModeWithEsc();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    this.leaveTaskEditingModeWithEsc();
  }

  leaveTaskEditingModeWithEsc() {
    this.tasks.update((prevState) => {
    return prevState.map((task) => {
        return {
          ...task,
          editing: false
        };
      });
    });
    this.newTaskCtrl.setValue('');
  } 

  updateTaskText(index: number) {
    if (this.newTaskCtrl.valid) {
      const input = this.newTaskCtrl.value.trim();
      if (input !== '') {
        this.tasks.update((prevState) => {
          return prevState.map((task, position) => {
            if (position === index) {
              return {
                ...task,
                title: input,
                editing: false
              };
            }
            return task
          });
        });
      }
    }
    this.newTaskCtrl.setValue('');
  }

  clearCompleted() {
    this.tasks.update((prevState) => {
      return prevState.filter((task) => task.completed === false);
    })

  }
}