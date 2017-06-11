import { ISearchResults } from './../models/ISearchResults';
import { ITodo } from './../models/ITodo';
import { IDataService } from './../models/IDataService';

export default class SearchController {
    public static $inject: string[] = ['DataService', '$window', '$rootScope'];

    public isLoading: boolean = false;
    public newItem: string = null;    
    public newToDoActive: boolean = false;
    public todoCollection: any[] = [];
    private hideFinishedTasks: boolean = false;

    constructor(
        private dataService: IDataService,
        private $window: angular.IWindowService, 
        private $rootScope: angular.IRootScopeService
    ) {
        
        const vm: SearchController = this;
        this.init();
    }

    private init(hideFinishedTasks?: boolean): void {
        this.hideFinishedTasks = hideFinishedTasks;
        this.loadTodos();
    }

    private loadTodos(): void {
        const vm: SearchController = this;
        this.isLoading = true;
        this.dataService.getTodos(vm.hideFinishedTasks)
        .then((todos: ITodo[]): void => {
            vm.todoCollection = todos;
        })
        .finally((): void => {
            vm.isLoading = false;
        });
    }

    public todoKeyDown($event: any): void {
        if ($event.keyCode === 13 && this.newItem.length > 0) {
        $event.preventDefault();

        this.todoCollection.unshift({ id: -1, title: this.newItem, done: false });
        const vm: SearchController = this;

        this.dataService.addTodo(this.newItem)
            .then((): void => {
            this.newItem = null;
            this.dataService.getTodos(vm.hideFinishedTasks)
                .then((todos: any[]): void => {
                this.todoCollection = todos;
                });
            });
        }
    }

    public completeTodo(todo: ITodo): void {
        todo.done = true;

        const vm: SearchController = this;

        this.dataService.setTodoStatus(todo, true)
            .then((): void => {
                this.dataService.getTodos(vm.hideFinishedTasks)
            .then((todos: any[]): void => {
                this.todoCollection = todos;
            });
        });
    }

    public undoTodo(todo: ITodo): void {
        todo.done = false;

        const vm: SearchController = this;

        this.dataService.setTodoStatus(todo, false)
            .then((): void => {
                this.dataService.getTodos(vm.hideFinishedTasks)
            .then((todos: any[]): void => {
                this.todoCollection = todos;
            });
        });
    }
}