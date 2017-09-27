import * as React from 'react';
import styles from './SpfxSearchDocument.module.scss';
import { ISpfxSearchDocumentProps } from './ISpfxSearchDocumentProps';
import { escape } from '@microsoft/sp-lodash-subset';

import {
  DocumentCard,
  DocumentCardPreview,
  DocumentCardTitle,
  DocumentCardActivity,
  IDocumentCardPreviewProps
} from 'office-ui-fabric-react/lib/DocumentCard';

export default class SpfxSearchDocument extends React.Component<ISpfxSearchDocumentProps, void> {
  public render(): JSX.Element {
    const previewProps: IDocumentCardPreviewProps = {
      previewImages: [
        {
          previewImageSrc: String(require('./document-preview.png')),
          iconSrc: String(require('./icon-ppt.png')),
          width: 318,
          height: 196,
          accentColor: '#ce4b1f'
        }
      ],
    };

    return (
      <DocumentCard onClickHref='http://bing.com'>
        <DocumentCardPreview { ...previewProps } />
        <DocumentCardTitle title='Revenue stream proposal fiscal year 2016 version02.pptx' />
        <DocumentCardActivity
          activity='Created Feb 23, 2016'
          people={
            [
              { name: 'Kat Larrson', profileImageSrc: String(require('./avatar-kat.png')) }
            ]
          }
        />
      </DocumentCard>
    );
  }
  
  // public render(): React.ReactElement<ISpfxSearchDocumentProps> {
  //   return (
  //     <div className={styles.spfxSearchDocument}>
  //       <div className={styles.container}>
  //         <div className={`ms-Grid-row ms-bgColor-themeDark ms-fontColor-white ${styles.row}`}>
  //           <div className="ms-Grid-col ms-u-lg10 ms-u-xl8 ms-u-xlPush2 ms-u-lgPush1">
  //             <span className="ms-font-xl ms-fontColor-white">Welcome to SharePoint!</span>
  //             <p className="ms-font-l ms-fontColor-white">Customize SharePoint experiences using Web Parts.</p>
  //             <p className="ms-font-l ms-fontColor-white">{escape(this.props.description)}</p>
  //             <a href="https://aka.ms/spfx" className={styles.button}>
  //               <span className={styles.label}>Learn more</span>
  //             </a>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
}
