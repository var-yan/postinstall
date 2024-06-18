/* 
  Workspaces Bar
  Copyright Francois Thirioux 2021
  GitHub contributors: @fthx, @null-git
  License GPL v3
*/

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Button} from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';


var WORKSPACES_SCHEMA = "org.gnome.desktop.wm.preferences";
var WORKSPACES_KEY = "workspace-names";


var SimpleWorkspacesBar = GObject.registerClass(
  class SimpleWorkspacesBar extends Button {
    _init() {
      super._init(0.0, 'Simple Workspaces Bar');
      this.track_hover = false;

      // define gsettings schema for workspaces names, get workspaces names,
      // signal for settings key changed
      this.workspaces_settings = new Gio.Settings({ schema: WORKSPACES_SCHEMA });
      this.workspaces_names_changed = this.workspaces_settings.connect(
        `changed::${WORKSPACES_KEY}`, this._update_workspaces_names.bind(this)
      );

      // hide Activities button
      this._show_activities(false);

      // bar creation
      this.ws_bar = new St.BoxLayout({});
      this._update_workspaces_names();
      this.add_child(this.ws_bar);

      // signals for workspaces state: active workspace, number of workspaces
      this._ws_active_changed = global.workspace_manager.connect(
        'active-workspace-changed', this._update_ws.bind(this)
      );
      this._ws_number_changed = global.workspace_manager.connect(
        'notify::n-workspaces', this._update_ws.bind(this)
      );
      this._restacked = global.display.connect(
        'restacked', this._update_ws.bind(this)
      );
      this._windows_changed = Shell.WindowTracker.get_default().connect(
        'tracked-windows-changed', this._update_ws.bind(this)
      );
    }

    // remove signals, restore Activities button, destroy workspaces bar
    _destroy() {
      this._show_activities(true);
      if (this._ws_active_changed) {
        global.workspace_manager.disconnect(this._ws_active_changed);
      }
      if (this._ws_number_changed) {
        global.workspace_manager.disconnect(this._ws_number_changed);
      }
      if (this._restacked) {
        global.display.disconnect(this._restacked);
      }
      if (this._windows_changed) {
        Shell.WindowTracker.get_default().disconnect(this._windows_changed);
      }
      if (this.workspaces_names_changed) {
        this.workspaces_settings.disconnect(this.workspaces_names_changed);
      }
      this.ws_bar.destroy();
      super.destroy();
    }

    // hide Activities button
    _show_activities(show) {
      this.activities_button = Main.panel.statusArea['activities'];
      if (this.activities_button) {
        if (show && !Main.sessionMode.isLocked) {
          this.activities_button.container.show();
        } else {
          this.activities_button.container.hide();
        }
      }
    }

    // update workspaces names
    _update_workspaces_names() {
      this.workspaces_names = this.workspaces_settings.get_strv(WORKSPACES_KEY);
      this._update_ws();
    }

    // get workspace button style class
    _get_ws_button_style_class(ws_active, ws_empty) {
      return (
        `desktop-label-${ws_empty ? '' : 'non'}empty-${ws_active ? '' : 'in'}active`
      );
    }

    // update the workspaces bar
    _update_ws() {
      // destroy old workspaces bar buttons
      this.ws_bar.destroy_all_children();

      // get number of workspaces
      this.ws_count = global.workspace_manager.get_n_workspaces();
      this.active_ws_index = global.workspace_manager.get_active_workspace_index();

      // display all current workspaces buttons
      for (let ws_index = 0; ws_index < this.ws_count; ++ws_index) {
        this.ws_box = new St.Bin(
          { visible: true, reactive: true, can_focus: true, track_hover: true }
        );
        this.ws_box.label = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
        this.ws_box.label.style_class = this._get_ws_button_style_class(
          ws_index == this.active_ws_index,
          global.workspace_manager.get_workspace_by_index(ws_index).n_windows <= 0,
        )
        this.ws_box.label.set_text(
          `  ${this.workspaces_names[ws_index] ?? ws_index + 1}  `
        );
        this.ws_box.set_child(this.ws_box.label);
        this.ws_box.connect('button-release-event', () => this._toggle_ws(ws_index));
        this.ws_bar.add_child(this.ws_box);
      }
    }

    // activate workspace or show overview
    _toggle_ws(ws_index) {
      if (global.workspace_manager.get_active_workspace_index() == ws_index) {
        Main.overview.toggle();
      } else {
        global.workspace_manager
          .get_workspace_by_index(ws_index)
          .activate(global.get_current_time());
      }
    }
  });

export default class SWBExtension extends Extension {
  enable() {
    this.workspaces_bar = new SimpleWorkspacesBar();
    Main.panel.addToStatusArea('simple-workspaces-bar', this.workspaces_bar, 0, 'center');
  }

  disable() {
    this.workspaces_bar._destroy();
    this.workspaces_bar = null;
  }
}

