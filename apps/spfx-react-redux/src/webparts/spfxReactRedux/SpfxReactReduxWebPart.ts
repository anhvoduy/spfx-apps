import * as React from 'react';
import * as ReactDom from 'react-dom';
//import { Provider } from 'redux';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'spfxReactReduxStrings';
import SpfxReactRedux from './components/SpfxReactRedux';
import { ISpfxReactReduxProps } from './components/ISpfxReactReduxProps';
import { ISpfxReactReduxWebPartProps } from './ISpfxReactReduxWebPartProps';

export default class SpfxReactReduxWebPart extends BaseClientSideWebPart<ISpfxReactReduxWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ISpfxReactReduxProps > = React.createElement(
      SpfxReactRedux,
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
