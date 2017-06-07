import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'welcomeStrings';
import Welcome from './components/Welcome';
import { IWelcomeProps } from './components/IWelcomeProps';
import { IWelcomeWebPartProps } from './IWelcomeWebPartProps';

export default class WelcomeWebPart extends BaseClientSideWebPart<IWelcomeWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IWelcomeProps > = React.createElement(
      Welcome,
      {
        description: this.properties.description
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
