import React, { Component } from 'react';
import AsyncApi, { ConfigInterface } from '@asyncapi/react-component';
import { solaceFeatureFlags } from './solace-overides';
import sample from './test.json';

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
import * as specs from './specs';

const defaultSchema = specs.streetlights;

interface State {
  schema: string;
  config: string;
  schemaFromExternalResource: string;
  refreshing: boolean;
  maasId: string;
  eapId: string;
}

class Playground extends Component<{}, State> {
  updateSchemaFn: (value: string) => void;
  updateConfigFn: (value: string) => void;

  state = {
    schema: '',
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

  componentDidMount() {
    const url = new URL(window.location.href);

    // console.log(url);
    // console.log(url.searchParams.get('orgId'));
    // console.log(url.searchParams.get('eapId'));

    const paths = url.pathname.split('/');
    console.log(paths);

    this.setState({
      maasId: paths[2] ?? '',
      eapId: paths[3] ?? '',
      schema: JSON.stringify(sample) ?? defaultSchema,
    });
  }

  render() {
    console.log(this.state);
    console.log(sample);

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
            <AsyncApi schema={schema} config={parsedConfig} />
          </AsyncApiWrapper>
        </SplitWrapper>
      </PlaygroundWrapper>
    );
  }

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
