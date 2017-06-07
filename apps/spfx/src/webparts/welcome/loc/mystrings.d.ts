declare interface IWelcomeStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
}

declare module 'welcomeStrings' {
  const strings: IWelcomeStrings;
  export = strings;
}
