import React, { Component } from 'react';
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
    description: '',
    title: 'Placeholder',
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

class Playground extends Component<{}, State> {
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

  /*
  function useDownloadAsyncApi(id: string) {
    const axios = useAxios();
    const mutation = useMutation((preview: AsyncApiPreview) =>
      axios.post(`api/v0/eventPortal/apiProducts/${id}/previewAsyncApi?format=${preview.format}`, preview.request)
    );
    return mutation;
  }


	saveAsyncApi(downloadAsyncApi.data);
	const saveAsyncApi = React.useCallback(
		(asyncApi) => {
			const contentType = asyncApi.headers["content-type"];
			let blob;
			if (contentType === "application/json") {
				const json = JSON.stringify(asyncApi.data, undefined, 2);
				blob = new Blob([json], { type: contentType });
			} else {
				blob = new Blob([asyncApi.data], { type: contentType });
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.download = `${product.name}.${contentType === "application/json" ? "json" : "yaml"}`;
			a.href = url;
			a.rel = "noopener";
			setTimeout(function () {
				URL.revokeObjectURL(a.href);
			}, 10000);
			setTimeout(function () {
				a.dispatchEvent(new MouseEvent("click"));
			}, 0);
			closeModal();
		},
		[closeModal, product.name]
	);

  */

  componentDidMount() {
    this.getSchema();
  }

  render() {
    // console.log(this.state);
    // console.log(sample);

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

  private getSchema = async () => {
    const url = new URL(window.location.href);

    // console.log(url);
    // console.log(url.searchParams.get('orgId'));
    // console.log(url.searchParams.get('eapId'));

    const paths = url.pathname.split('/');
    console.log(paths);

    this.startRefreshing();

    fetch('http://localhost:3001/sample-async-api.json', {
      method: 'GET',
      mode: 'no-cors',
      credentials: 'omit',
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          // maasId: paths[2] ?? '',
          // eapId: paths[3] ?? '',
          schema: JSON.stringify(data) ?? {},
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
