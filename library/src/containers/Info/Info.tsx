import React from 'react';

import { TermsOfServiceComponent } from './TermsOfService';
import { LicenseComponent } from './License';
import { ContactComponent } from './Contact';
import { DefaultContentTypeComponent } from './DefaultContentType';

import { Markdown, CollapseButton } from '../../components';
import { bemClasses } from '../../helpers';
import { Info, DefaultContentType } from '../../types';
import { DOWNLOAD_YAML, DOWNLOAD_JSON } from '../../constants';

interface Props {
  info: Info;
  defaultContentType?: DefaultContentType;
  downloadAsyncApi?: (format: 'yaml' | 'json') => void;
}

export const InfoComponent: React.FunctionComponent<Props> = ({
  info: { title, version, description, termsOfService, contact, license },
  downloadAsyncApi,
  defaultContentType,
}) => {
  const className = `info`;
  const showInfoList =
    defaultContentType || termsOfService || license || contact;

  const handleDownloadAsyncApi = (
    e: React.SyntheticEvent,
    format: 'yaml' | 'json',
  ) => {
    e.preventDefault();
    if (downloadAsyncApi) {
      downloadAsyncApi(format);
    }
  };

  return (
    <section
      className={bemClasses.element(className)}
      id={bemClasses.identifier([className])}
    >
      <header className={bemClasses.element(`${className}-header`)}>
        <div className={bemClasses.element(`${className}-header-main`)}>
          <h1>
            <span className={bemClasses.element(`${className}-header-title`)}>
              {title}
            </span>
            {/* {version && (
              <span
                className={bemClasses.element(`${className}-header-version`)}
              >
                {version}
              </span>
            )} */}
          </h1>

          <button
            className={bemClasses.element(`collapse-button`)}
            onClick={e => handleDownloadAsyncApi(e, 'json')}
            style={{
              marginRight: '16px',
            }}
          >
            <span>{DOWNLOAD_JSON}</span>
          </button>
          <button
            className={bemClasses.element(`collapse-button`)}
            onClick={e => handleDownloadAsyncApi(e, 'yaml')}
            style={{
              marginRight: '16px',
            }}
          >
            <span>{DOWNLOAD_YAML}</span>
          </button>

          <CollapseButton />
        </div>
        {!showInfoList ? null : (
          <ul className={bemClasses.element(`${className}-list`)}>
            {defaultContentType && (
              <li
                className={bemClasses.element(
                  `${className}-default-content-type`,
                )}
              >
                <DefaultContentTypeComponent type={defaultContentType} />
              </li>
            )}
            {termsOfService && (
              <li
                className={bemClasses.element(`${className}-terms-of-service`)}
              >
                <TermsOfServiceComponent url={termsOfService} />
              </li>
            )}
            {license && (
              <li className={bemClasses.element(`${className}-license`)}>
                <LicenseComponent {...license} />
              </li>
            )}
            {contact && (contact.url || contact.email) ? (
              <ContactComponent {...contact} />
            ) : null}
          </ul>
        )}
      </header>
      {description && (
        <div className={bemClasses.element(`${className}-description`)}>
          <Markdown>{description}</Markdown>
        </div>
      )}
    </section>
  );
};
