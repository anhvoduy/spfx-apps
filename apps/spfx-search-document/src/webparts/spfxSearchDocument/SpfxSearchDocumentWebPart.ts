import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'spfxSearchDocumentStrings';
import SpfxSearchDocument from './components/SpfxSearchDocument';
import { ISpfxSearchDocumentProps } from './components/ISpfxSearchDocumentProps';
import { ISpfxSearchDocumentWebPartProps } from './ISpfxSearchDocumentWebPartProps';

export default class SpfxSearchDocumentWebPart extends BaseClientSideWebPart<ISpfxSearchDocumentWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ISpfxSearchDocumentProps > = React.createElement(
      SpfxSearchDocument,
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
