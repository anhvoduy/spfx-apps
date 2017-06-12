declare interface ISpfxNgTodoStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  HideFinishedTasksFieldLabel: string;
}

declare module 'spfxNgTodoStrings' {
  const strings: ISpfxNgTodoStrings;
  export = strings;
}
