import React, { Component } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import AsyncApi, { ConfigInterface } from '@asyncapi/react-component';
import { solaceFeatureFlags } from './solace-overides';

import {
  Navigation,
  CodeEditorComponent,
  FetchSchema,
  RefreshIcon,
  Tabs,
  Tab,
  PlaygroundWrapper,
  CodeEditorsWrapper,
  AsyncApiWrapper,
  SplitWrapper,
} from './components';

import { defaultConfig, parse, debounce } from './common';

const placeholder = {
  components: {
    schemas: {},
    messages: {},
  },
  servers: {},
  channels: {},
  asyncapi: '2.0.0',
  info: {
    description: 'Please upload an AsyncAPI',
    title: 'No AsyncAPI',
    version: '0',
  },
};

interface State {
  schema: string;
  config: string;
  schemaFromExternalResource: string;
  refreshing: boolean;
  maasId: string;
  eapId: string;
}

class Playground extends Component<RouteComponentProps, State> {
  updateSchemaFn: (value: string) => void;
  updateConfigFn: (value: string) => void;

  state = {
    schema: JSON.stringify(placeholder),
    config: defaultConfig,
    schemaFromExternalResource: '',
    refreshing: false,
    maasId: '',
    eapId: '',
  };

  constructor(props: any) {
    super(props);
    this.updateSchemaFn = debounce(
      this.updateSchema,
      750,
      this.startRefreshing,
      this.stopRefreshing,
    );
    this.updateConfigFn = debounce(
      this.updateConfig,
      750,
      this.startRefreshing,
      this.stopRefreshing,
    );
  }

  render() {
    const { schema, config, schemaFromExternalResource } = this.state;
    const parsedConfig = parse<ConfigInterface>(config || defaultConfig);

    return (
      <PlaygroundWrapper>
        <Navigation />
        <SplitWrapper>
          <React.Fragment>
            {solaceFeatureFlags.SHOW_CODE_EDITOR && (
              <CodeEditorsWrapper>
                <Tabs
                  additionalHeaderContent={this.renderAdditionalHeaderContent()}
                >
                  <Tab title="Schema" key="Schema">
                    <>
                      <FetchSchema
                        parentCallback={this.updateSchemaFromExternalResource}
                      />
                      <CodeEditorComponent
                        key="Schema"
                        code={schema}
                        externalResource={schemaFromExternalResource}
                        parentCallback={this.updateSchemaFn}
                        mode="text/yaml"
                      />
                    </>
                  </Tab>
                  <Tab title="Configuration" key="Configuration">
                    <CodeEditorComponent
                      key="Configuration"
                      code={config}
                      parentCallback={this.updateConfigFn}
                    />
                  </Tab>
                </Tabs>
              </CodeEditorsWrapper>
            )}
          </React.Fragment>

          <AsyncApiWrapper>
            <AsyncApi
              schema={schema}
              config={parsedConfig}
              downloadAsyncApi={this.downloadAsyncApi}
            />
          </AsyncApiWrapper>
        </SplitWrapper>
      </PlaygroundWrapper>
    );
  }

  componentDidMount() {
    this.getSchema();
  }

  downloadAsyncApi = (format: 'yaml' | 'json') => {
    const link = document.createElement('a');

    link.href = `/asyncapi${this.state.maasId ? '/' + this.state.maasId : ''}${
      this.state.eapId ? '/' + this.state.eapId : ''
    }/asyncapi.${format}`;
    link.setAttribute('download', `asyncapi.${format}`);

    // Append to html link element page
    document.body.appendChild(link);

    // Start download
    link.click();

    // Clean up and remove the link
    link?.parentNode?.removeChild(link);
  };

  private getSchema = async () => {
    const {
      match: { params },
    } = this.props;
    const { maasId, eapId }: any = params;

    if (!eapId) {
      return;
    }

    const url = `/asyncapi${maasId ? '/' + maasId : ''}${
      eapId ? '/' + eapId : ''
    }/asyncapi.json`;

    console.log('maasId: ', maasId);
    console.log('eapId: ', eapId);
    console.log('asynAPI-URL: ', url);

    this.startRefreshing();

    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.setState({
          maasId,
          eapId,
          schema: JSON.stringify(data ?? placeholder),
        });
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        this.stopRefreshing();
      });
  };

  private updateSchema = (schema: string) => {
    this.setState({ schema });
  };

  private updateSchemaFromExternalResource = (schema: string) => {
    this.setState({ schemaFromExternalResource: schema });
  };

  private updateConfig = (config: string) => {
    this.setState({ config });
  };

  private startRefreshing = (): void => {
    setTimeout(() => {
      this.setState({ refreshing: true });
    }, 500);
  };

  private stopRefreshing = (): void => {
    this.setState({ refreshing: false });
  };

  private renderAdditionalHeaderContent = () => (
    <RefreshIcon show={this.state.refreshing}>{'\uE00A'}</RefreshIcon>
  );
}

export default Playground;
