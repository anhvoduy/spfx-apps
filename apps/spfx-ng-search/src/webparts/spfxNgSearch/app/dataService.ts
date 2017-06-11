import { ISearchResults } from './../models/ISearchResults';
import { ITodo } from './../models/ITodo';
import { IDataService } from './../models/IDataService';

import * as angular from 'angular';

export default class DataService implements IDataService {
    private items: ITodo[] = [
        {
            id: 1,
            title: 'Prepare demo Web Part',
            done: true
        },
        {
            id: 2,
            title: 'Show demo',
            done: false
        },
        {
            id: 3,
            title: 'Share code',
            done: false
        }
    ];
    private nextId: number = 4;

    public static $inject: string[] = ['$q'];    
    constructor(private $q: angular.IQService){

    }

    public getTodos(hideFinishedTasks: boolean): angular.IPromise<ITodo[]>{
        const deferred: angular.IDeferred<ITodo[]> = this.$q.defer();

        const todos: ITodo[] = [];
        for (let i: number = 0; i < this.items.length; i++) {
            if (hideFinishedTasks && this.items[i].done) {
                continue;
            }
            todos.push(this.items[i]);
        }
        
        deferred.resolve(todos);        
        return deferred.promise;
    };

    public addTodo(todo: string): angular.IPromise<{}>{
        const deferred: angular.IDeferred<ITodo[]> = this.$q.defer();

        this.items.push({
            id: this.nextId++,
            title: todo,
            done: false
            });

            deferred.resolve();


        return deferred.promise;
    };
  
    public deleteTodo(todo: ITodo): angular.IPromise<{}>{
        const deferred: angular.IDeferred<ITodo[]> = this.$q.defer();   

        let pos: number = -1;
        for (let i: number = 0; i < this.items.length; i++) {
            if (this.items[i].id === todo.id) {
                pos = i;
                break;
            }
        }

        if (pos > -1) {
            this.items.splice(pos, 1);
            deferred.resolve();
        }
        else {
            deferred.reject();
        }
        return deferred.promise;
    };

    public setTodoStatus(todo: ITodo, done: boolean): angular.IPromise<{}>{
        const deferred: angular.IDeferred<ITodo[]> = this.$q.defer();

        for (let i: number = 0; i < this.items.length; i++) {
            if (this.items[i].id === todo.id) {
                this.items[i].done = done;
            }
        }

        deferred.resolve();
        
        return deferred.promise;
    };
}
