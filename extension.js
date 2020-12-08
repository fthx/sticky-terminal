/*	Sticky Terminal
	GNOME Shell extension
	(c) Francois Thirioux 2020
	License: GPLv3 */
	

const { GLib, GObject, Shell, St } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Lang = imports.lang;

// desktop app to handle, can be different from terminal app
// e.g.: const APP = "R.desktop";
// e.g.: const APP = "org.gnome.Nautilus.desktop";
// the button icon is created from this app
const APP = "org.gnome.Terminal.desktop";
// desktop file really started (could be the same or not, e.g. when your app starts in a terminal)
//e.g.: const REAL_APP = "org.gnome.Nautilus.desktop";
const REAL_APP = "org.gnome.Terminal.desktop";
// app window sticky state when opened
const STICKY = true;
// initial app window size (% of display size)
const APP_WINDOW_X_RATIO = 0.40;
const APP_WINDOW_Y_RATIO = 0.40;


var AppButton = GObject.registerClass(
class AppButton extends PanelMenu.Button {
	_init() {
		super._init(0.0, 'App Button');
		
		// get application and icon, get real application
		this.app = Shell.AppSystem.get_default().lookup_app(APP);
		this.real_app = Shell.AppSystem.get_default().lookup_app(REAL_APP);
		this.app_icon = new St.Icon({icon_name: 'utilities-terminal-symbolic', style_class: 'system-status-icon'});
		// you can display a non-symbolic icon for any app by uncommenting the following line
		//this.app_icon = this.app.create_icon_texture(20);
		
		// create button
        this.hbox = new St.BoxLayout({style_class: 'panel-button', visible: true, reactive: true, can_focus: true, track_hover: true}); 
        this.hbox.add_child(this.app_icon);
        this.add_child(this.hbox);
        
        // connect signal on click: create, show or hide app window
        this.click = this.connect('button-press-event', Lang.bind(this, this._toggle_app));
	}
	
	_toggle_app() {
		// need to check if app window exists and is not null
		if (this.real_app_window && !(typeof this.real_app.get_windows()[0] == "undefined")) {
			if (this.real_app_window.minimized) {
				this.real_app_window.unminimize();
				// get focus too
				this.real_app_window.activate(global.get_current_time());
			} else {
				this.real_app_window.minimize();
			}
		} else {
			this.app.open_new_window(-1);
			// need to wait some time for effective window registration
			this.real_app_window_timeout = GLib.timeout_add_seconds(GLib.PRIORITY_LOW, 1, Lang.bind(this, function() {
				this.real_app_window = this.real_app.get_windows()[0];
				if (STICKY) {
					// this window will always be above other ones
					this.real_app_window.make_above();
				};
				[this.display_x, this.display_y] = global.display.get_size();
				[this.real_app_window_x, this.real_app_window_y] = [APP_WINDOW_X_RATIO * this.display_x, APP_WINDOW_Y_RATIO * this.display_y];
				this.real_app_window.move_resize_frame(true, this.display_x - this.real_app_window_x - 10, this.display_y - this.real_app_window_y - 5, this.real_app_window_x, this.real_app_window_y);
			}));
		}
	}
	
	_destroy() {
		this.disconnect(this.click);
		if (this.real_app_window_timeout) {
			GLib.source_remove(this.real_app_window_timeout)
		};
		super.destroy();
	}
})

function init() {
}

var _app_button;

function enable() {
    _app_button = new AppButton();
    Main.panel.addToStatusArea('app-button', _app_button);
}

function disable() {
    _app_button._destroy();
}
