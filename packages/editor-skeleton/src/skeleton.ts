import { Editor, action, makeObservable } from '@firefly/auto-editor-core';
import {
  DockConfig,
  PanelConfig,
  WidgetConfig,
  IWidgetBaseConfig,
  PanelDockConfig,
  DialogDockConfig,
  isDockConfig,
  isPanelDockConfig,
  isPanelConfig,
  DividerConfig,
  isDividerConfig,
  IWidgetConfigArea,
} from './types';
import Panel, { isPanel } from './widget/panel';
import WidgetContainer from './widget/widget-container';
import Area from './area';
import Widget, { isWidget, IWidget } from './widget/widget';
import PanelDock from './widget/panel-dock';
import Dock from './widget/dock';
import { Stage, StageConfig } from './widget/stage';
import { isValidElement } from 'react';
import { isPlainObject, uniqueId } from '@alilc/lowcode-utils';
import { Divider } from '@alifd/next';
import { EditorConfig, PluginClassSet } from '@alilc/lowcode-types';

export enum SkeletonEvents {
  PANEL_DOCK_ACTIVE = 'skeleton.panel-dock.active',
  PANEL_DOCK_UNACTIVE = 'skeleton.panel-dock.unactive',
  PANEL_SHOW = 'skeleton.panel.show',
  PANEL_HIDE = 'skeleton.panel.hide',
  WIDGET_SHOW = 'skeleton.widget.show',
  WIDGET_HIDE = 'skeleton.widget.hide',
  WIDGET_DISABLE = 'skeleton.widget.disable',
  WIDGET_ENABLE = 'skeleton.widget.enable',
}

export class Skeleton {
  private panels = new Map<string, Panel>();

  private containers = new Map<string, WidgetContainer<any>>();

  readonly leftArea: Area<DockConfig | PanelDockConfig | DialogDockConfig>;

  readonly leftFloatArea: Area<PanelConfig, Panel>;

  readonly mainArea: Area<WidgetConfig | PanelConfig, Widget | Panel>;

  readonly stages: Area<StageConfig, Stage>;

  constructor(readonly editor: Editor) {
    makeObservable(this);

    this.leftArea = new Area(
      this,
      'leftArea',
      (config) => {
        if (isWidget(config)) {
          return config;
        }
        return this.createWidget(config);
      },
      false,
    );

    this.leftFloatArea = new Area(
      this,
      'leftFloatArea',
      (config) => {
        if (isPanel(config)) {
          return config;
        }
        return this.createPanel(config);
      },
      true,
    );

    this.mainArea = new Area(
      this,
      'mainArea',
      (config) => {
        if (isWidget(config)) {
          return config as Widget;
        }
        return this.createWidget(config) as Widget;
      },
      true,
      true,
    );
    this.stages = new Area(this, 'stages', (config) => {
      if (isWidget(config)) {
        return config;
      }
      return new Stage(this, config);
    });

    this.setupPlugins();
    this.setupEvents();
  }
  /**
   * setup events
   *
   * @memberof Skeleton
   */
  setupEvents() {
    // adjust pinned status when panel shown
    // this.editor.on('skeleton.panel.show', (panelName, panel) => {
    //   const panelNameKey = `${panelName}-pinned-status-isFloat`;
    //   const isInFloatAreaPreferenceExists = this.editor?.getPreference()?.contains(panelNameKey, 'skeleton');
    //   if (isInFloatAreaPreferenceExists) {
    //     const isInFloatAreaFromPreference = this.editor?.getPreference()?.get(panelNameKey, 'skeleton');
    //     const isCurrentInFloatArea = panel?.isChildOfFloatArea();
    //     if (isInFloatAreaFromPreference !== isCurrentInFloatArea) {
    //       this.toggleFloatStatus(panel);
    //     }
    //   }
    // });
  }

  /**
   * set isFloat status for panel
   *
   * @param {*} panel
   * @memberof Skeleton
   */
  @action
  toggleFloatStatus(panel: Panel) {
    // const isFloat = panel?.parent?.name === 'leftFloatArea';
    // if (isFloat) {
    //   this.leftFloatArea.remove(panel);
    //   this.leftFixedArea.add(panel);
    //   this.leftFixedArea.container.active(panel);
    // } else {
    //   this.leftFixedArea.remove(panel);
    //   this.leftFloatArea.add(panel);
    //   this.leftFloatArea.container.active(panel);
    // }
    // this.editor?.getPreference()?.set(`${panel.name}-pinned-status-isFloat`, !isFloat, 'skeleton');
  }

  buildFromConfig(config?: EditorConfig, components: PluginClassSet = {}) {
    if (config) {
      this.editor.init(config, components);
    }
    this.setupPlugins();
  }

  private setupPlugins() {
    const { config, components = {} } = this.editor;
    if (!config) {
      return;
    }

    const { plugins } = config;
    if (!plugins) {
      return;
    }
    Object.keys(plugins).forEach((area) => {
      plugins[area].forEach((item) => {
        const { pluginKey, type, props = {}, pluginProps } = item;
        const config: Partial<IWidgetBaseConfig> = {
          area: area as IWidgetConfigArea,
          type: 'Widget',
          name: pluginKey,
          contentProps: pluginProps,
        };
        const { dialogProps, balloonProps, panelProps, linkProps, ...restProps } = props;
        config.props = restProps;
        if (dialogProps) {
          config.dialogProps = dialogProps;
        }
        if (balloonProps) {
          config.balloonProps = balloonProps;
        }
        if (panelProps) {
          config.panelProps = panelProps;
        }
        if (linkProps) {
          config.linkProps = linkProps;
        }
        if (type === 'TabPanel') {
          config.type = 'Panel';
        } else if (/Icon$/.test(type)) {
          config.type = type.replace('Icon', 'Dock');
        }
        if (pluginKey in components) {
          config.content = components[pluginKey];
        }
        this.add(config as IWidgetBaseConfig);
      });
    });
  }

  postEvent(event: SkeletonEvents, ...args: any[]) {
    // this.editor.emit(event, ...args);
  }

  readonly widgets: IWidget[] = [];

  createWidget(config: IWidgetBaseConfig | IWidget) {
    if (isWidget(config)) {
      return config;
    }

    config = this.parseConfig(config);
    let widget: IWidget;
    if (isDockConfig(config)) {
      if (isPanelDockConfig(config)) {
        console.log('********', config);
        // outline-pane
        widget = new PanelDock(this, config);
        if (config.name === 'outline-pane') {
          (widget as any).togglePanel();
        }
      } else if (false) {
        // DialogDock
        // others...
      } else {
        widget = new Dock(this, config);
      }
    } else if (isDividerConfig(config)) {
      widget = new Widget(this, {
        ...config,
        type: 'Widget',
        content: Divider,
      });
    } else if (isPanelConfig(config)) {
      widget = this.createPanel(config);
    } else {
      widget = new Widget(this, config as WidgetConfig);
    }
    this.widgets.push(widget);
    return widget;
  }

  getWidget(name: string): IWidget | undefined {
    return this.widgets.find(widget => widget.name === name);
  }

  createPanel(config: PanelConfig) {
    const parsedConfig = this.parseConfig(config);
    const panel = new Panel(this, parsedConfig as PanelConfig);
    this.panels.set(panel.name, panel);
    return panel;
  }

  getPanel(name: string): Panel | undefined {
    return this.panels.get(name);
  }

  getStage(name: string) {
    return this.stages.container.get(name);
  }

  createStage(config: any) {
    const stage = this.add({
      name: uniqueId('stage'),
      area: 'stages',
      ...config,
    });
    return stage?.getName?.();
  }

  createContainer(
    name: string,
    handle: (item: any) => any,
    exclusive = false,
    checkVisible: () => boolean = () => true,
    defaultSetCurrent = false,
  ) {
    const container = new WidgetContainer(name, handle, exclusive, checkVisible, defaultSetCurrent);
    this.containers.set(name, container);
    return container;
  }

  private parseConfig(config: IWidgetBaseConfig) {
    if (config.parsed) {
      return config;
    }
    const { content, ...restConfig } = config;
    if (content) {
      if (isPlainObject(content) && !isValidElement(content)) {
        Object.keys(content).forEach((key) => {
          if (/props$/i.test(key) && restConfig[key]) {
            restConfig[key] = {
              ...restConfig[key],
              ...content[key],
            };
          } else {
            restConfig[key] = content[key];
          }
        });
      } else {
        restConfig.content = content;
      }
    }
    restConfig.pluginKey = restConfig.name;
    restConfig.parsed = true;
    return restConfig;
  }

  add(config: IWidgetBaseConfig, extraConfig?: Record<string, any>) {
    const parsedConfig = {
      ...this.parseConfig(config),
      ...extraConfig,
    };
    let { area } = parsedConfig;
    if (!area) {
      if (parsedConfig.type === 'Panel') {
        area = 'leftFloatArea';
      } else if (parsedConfig.type === 'Widget') {
        area = 'mainArea';
      } else {
        area = 'leftArea';
      }
    }
    switch (area) {
      case 'leftArea':
      case 'left':
        return this.leftArea.add(parsedConfig as PanelDockConfig);
      case 'mainArea':
      case 'main':
      case 'center':
      case 'centerArea':
        return this.mainArea.add(parsedConfig as PanelConfig);
      case 'leftFloatArea':
        return this.leftFloatArea.add(parsedConfig as PanelConfig);
      case 'stages':
        return this.stages.add(parsedConfig as StageConfig);
      default:
        // do nothing
    }
  }
}
