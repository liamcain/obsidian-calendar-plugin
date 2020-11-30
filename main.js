'use strict';

var obsidian = require('obsidian');
var path = require('path');
var os = require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var obsidian__default = /*#__PURE__*/_interopDefaultLegacy(obsidian);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

const DEFAULT_WEEK_FORMAT = "YYYY-[W]ww";
const DEFAULT_WORDS_PER_DOT = 250;
const VIEW_TYPE_CALENDAR = "calendar";

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function is_promise(value) {
    return value && typeof value === 'object' && typeof value.then === 'function';
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = value;
        let child_ctx = info.ctx;
        if (key !== undefined) {
            child_ctx = child_ctx.slice();
            child_ctx[key] = value;
        }
        const block = type && (info.current = type)(child_ctx);
        let needs_flush = false;
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block, i) => {
                    if (i !== index && block) {
                        group_outros();
                        transition_out(block, 1, 1, () => {
                            info.blocks[i] = null;
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            needs_flush = true;
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
        if (needs_flush) {
            flush();
        }
    }
    if (is_promise(promise)) {
        const current_component = get_current_component();
        promise.then(value => {
            set_current_component(current_component);
            update(info.then, 1, info.value, value);
            set_current_component(null);
        }, error => {
            set_current_component(current_component);
            update(info.catch, 2, info.error, error);
            set_current_component(null);
            if (!info.hasCatch) {
                throw error;
            }
        });
        // if we previously had a then/catch block, destroy it
        if (info.current !== info.pending) {
            update(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update(info.then, 1, info.value, promise);
            return true;
        }
        info.resolved = promise;
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var main = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });




/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
function getNotePath(directory, filename) {
    if (!filename.endsWith(".md")) {
        filename += ".md";
    }
    return obsidian__default['default'].normalizePath(path__default['default'].join(directory, filename));
}
/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
function getDailyNoteSettings() {
    var _a, _b;
    try {
        // XXX: Access private API for internal plugins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var settings = window.app.internalPlugins.plugins["daily-notes"]
            .instance.options;
        return {
            format: settings.format || DEFAULT_DATE_FORMAT,
            folder: ((_a = settings.folder) === null || _a === void 0 ? void 0 : _a.trim()) || "",
            template: ((_b = settings.template) === null || _b === void 0 ? void 0 : _b.trim()) || "",
        };
    }
    catch (err) {
        console.info("No custom daily note settings found!", err);
    }
}
function appHasDailyNotesPluginLoaded() {
    var app = window.app;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var dailyNotesPlugin = app.internalPlugins.plugins["daily-notes"];
    return dailyNotesPlugin && dailyNotesPlugin.enabled;
}
function getTemplateContents(template) {
    return __awaiter(this, void 0, void 0, function () {
        var app, metadataCache, vault, templatePath, templateFile, contents, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = window.app;
                    metadataCache = app.metadataCache, vault = app.vault;
                    templatePath = obsidian__default['default'].normalizePath(template);
                    if (templatePath === "/") {
                        return [2 /*return*/, Promise.resolve("")];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
                    return [4 /*yield*/, vault.cachedRead(templateFile)];
                case 2:
                    contents = _a.sent();
                    return [2 /*return*/, contents];
                case 3:
                    err_1 = _a.sent();
                    console.error("Failed to read daily note template '" + templatePath + "'", err_1);
                    new obsidian__default['default'].Notice("Failed to read the daily note template");
                    return [2 /*return*/, ""];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * This function mimics the behavior of the daily-notes plugin
 * so it will replace {{date}}, {{title}}, and {{time}} with the
 * formatted timestamp.
 *
 * Note: it has an added bonus that it's not 'today' specific.
 */
function createDailyNote(date) {
    return __awaiter(this, void 0, void 0, function () {
        var app, vault, moment, _a, template, format, folder, templateContents, filename, normalizedPath, createdFile, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    app = window.app;
                    vault = app.vault;
                    moment = window.moment;
                    _a = getDailyNoteSettings(), template = _a.template, format = _a.format, folder = _a.folder;
                    return [4 /*yield*/, getTemplateContents(template)];
                case 1:
                    templateContents = _b.sent();
                    filename = date.format(format);
                    normalizedPath = getNotePath(folder, filename);
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, vault.create(normalizedPath, templateContents
                            .replace(/{{\s*(date|time)\s*:(.*?)}}/gi, function (_, timeOrDate, momentFormat) {
                            return date.format(momentFormat.trim());
                        })
                            .replace(/{{\s*date\s*}}/gi, filename)
                            .replace(/{{\s*time\s*}}/gi, moment().format("HH:mm"))
                            .replace(/{{\s*title\s*}}/gi, filename))];
                case 3:
                    createdFile = _b.sent();
                    return [2 /*return*/, createdFile];
                case 4:
                    err_2 = _b.sent();
                    console.error("Failed to create file: '" + normalizedPath + "'", err_2);
                    new obsidian__default['default'].Notice("Unable to create new file.");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getDailyNote(date, dailyNotes) {
    /**
     * Look for an exact match filename first, if one doesn't
     * exist, walk through all the daily notes and find any files
     * on the same day.
     */
    var vault = window.app.vault;
    var _a = getDailyNoteSettings(), format = _a.format, folder = _a.folder;
    var formattedDate = date.format(format);
    var dailyNotePath = getNotePath(folder, formattedDate);
    var exactMatch = vault.getAbstractFileByPath(dailyNotePath);
    if (exactMatch) {
        return exactMatch;
    }
    for (var _i = 0, dailyNotes_1 = dailyNotes; _i < dailyNotes_1.length; _i++) {
        var dailyNote = dailyNotes_1[_i];
        if (dailyNote.date.isSame(date, "day")) {
            return dailyNote.file;
        }
    }
    return null;
}
function getAllDailyNotes() {
    /**
     * Find all daily notes in the daily note folder
     */
    var moment = window.moment;
    var vault = window.app.vault;
    var _a = getDailyNoteSettings(), format = _a.format, folder = _a.folder;
    var dailyNotesFolder = folder
        ? vault.getAbstractFileByPath(folder)
        : vault.getRoot();
    var dailyNotes = [];
    for (var _i = 0, _b = dailyNotesFolder.children; _i < _b.length; _i++) {
        var loadedFile = _b[_i];
        if (loadedFile instanceof obsidian__default['default'].TFile) {
            var noteDate = moment(loadedFile.basename, format, true);
            if (noteDate.isValid()) {
                dailyNotes.push({
                    date: noteDate,
                    file: loadedFile,
                });
            }
        }
    }
    return dailyNotes;
}

exports.DEFAULT_DATE_FORMAT = DEFAULT_DATE_FORMAT;
exports.appHasDailyNotesPluginLoaded = appHasDailyNotesPluginLoaded;
exports.createDailyNote = createDailyNote;
exports.getAllDailyNotes = getAllDailyNotes;
exports.getDailyNote = getDailyNote;
exports.getDailyNoteSettings = getDailyNoteSettings;
exports.getTemplateContents = getTemplateContents;

});

function getWeeklyNoteSettings(settings) {
    return {
        format: settings.weeklyNoteFormat || DEFAULT_WEEK_FORMAT,
        folder: settings.weeklyNoteFolder ? settings.weeklyNoteFolder.trim() : "",
        template: settings.weeklyNoteTemplate
            ? settings.weeklyNoteTemplate.trim()
            : "",
    };
}
const SettingsInstance = writable({
    shouldConfirmBeforeCreate: true,
    weekStart: "locale",
    wordsPerDot: DEFAULT_WORDS_PER_DOT,
    showWeeklyNote: false,
    weeklyNoteFormat: "",
    weeklyNoteTemplate: "",
    weeklyNoteFolder: "",
});
function syncMomentLocaleWithSettings(settings) {
    const { moment } = window;
    const currentLocale = moment.locale();
    // Save the initial locale weekspec so that we can restore
    // it when toggling between the different options in settings.
    if (!window._bundledLocaleWeekSpec) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window._bundledLocaleWeekSpec = moment.localeData()._week;
    }
    if (settings.weekStart === "locale") {
        moment.updateLocale(currentLocale, {
            week: window._bundledLocaleWeekSpec,
        });
    }
    else {
        moment.updateLocale(currentLocale, {
            week: {
                dow: settings.weekStart === "monday" ? 1 : 0,
            },
        });
    }
}
class CalendarSettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        this.containerEl.empty();
        this.containerEl.createEl("h3", {
            text: "General Settings",
        });
        this.addDotThresholdSetting();
        this.addStartWeekOnMondaySetting();
        this.addConfirmCreateSetting();
        this.addShowWeeklyNoteSetting();
        if (this.plugin.options.showWeeklyNote) {
            this.containerEl.createEl("h3", {
                text: "Weekly Note Settings",
            });
            this.addWeeklyNoteFormatSetting();
            this.addWeeklyNoteTemplateSetting();
            this.addWeeklyNoteFolderSetting();
        }
        if (!main.appHasDailyNotesPluginLoaded()) {
            this.containerEl.createEl("h3", {
                text: "⚠️ Daily Notes plugin not enabled",
            });
            this.containerEl.createEl("p", {
                text: "The calendar is best used in conjunction with the Daily Notes plugin. Enable it in your plugin settings for a more optimal experience.",
            });
        }
    }
    addDotThresholdSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Words per dot")
            .setDesc("How many words should be represented a single dot?")
            .addText((textfield) => {
            textfield.setPlaceholder(String(DEFAULT_WORDS_PER_DOT));
            textfield.inputEl.type = "number";
            textfield.setValue(String(this.plugin.options.wordsPerDot));
            textfield.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.wordsPerDot = Number(value)));
            });
        });
    }
    addStartWeekOnMondaySetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Start week on Monday")
            .setDesc("Enable this to show Monday as the first day on the calendar")
            .addDropdown((dropdown) => {
            dropdown.addOption("locale", "Locale default");
            dropdown.addOption("sunday", "Sunday");
            dropdown.addOption("monday", "Monday");
            dropdown.setValue(this.plugin.options.weekStart);
            dropdown.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.weekStart = value));
            });
        });
    }
    addConfirmCreateSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Confirm before creating new note")
            .setDesc("Show a confirmation modal before creating a new note")
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.options.shouldConfirmBeforeCreate);
            toggle.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.shouldConfirmBeforeCreate = value));
            });
        });
    }
    addShowWeeklyNoteSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Show week number")
            .setDesc("Enable this to add a column with the week number")
            .addToggle((toggle) => {
            toggle.setValue(this.plugin.options.showWeeklyNote);
            toggle.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.showWeeklyNote = value));
                this.display(); // show/hide weekly settings
            });
        });
    }
    addWeeklyNoteFormatSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Weekly note format")
            .setDesc("For more syntax help, refer to format reference")
            .addText((textfield) => {
            textfield.setValue(this.plugin.options.weeklyNoteFormat);
            textfield.setPlaceholder(DEFAULT_WEEK_FORMAT);
            textfield.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.weeklyNoteFormat = value));
            });
        });
    }
    addWeeklyNoteTemplateSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Weekly note template")
            .setDesc("Choose the file you want to use as the template for your weekly notes")
            .addText((textfield) => {
            textfield.setValue(this.plugin.options.weeklyNoteTemplate);
            textfield.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.weeklyNoteTemplate = value));
            });
        });
    }
    addWeeklyNoteFolderSetting() {
        new obsidian.Setting(this.containerEl)
            .setName("Weekly note folder")
            .setDesc("New weekly notes will be placed here")
            .addText((textfield) => {
            textfield.setValue(this.plugin.options.weeklyNoteFolder);
            textfield.onChange(async (value) => {
                this.plugin.writeOptions((old) => (old.weeklyNoteFolder = value));
            });
        });
    }
}

class ConfirmationModal extends obsidian.Modal {
    constructor(app, config) {
        super(app);
        const { cta, onAccept, text, title } = config;
        this.contentEl.createEl("h2", { text: title });
        this.contentEl.createEl("p", { text });
        this.contentEl
            .createEl("button", { text: "Never mind" })
            .addEventListener("click", () => this.close());
        this.contentEl
            .createEl("button", {
            cls: "mod-cta",
            text: cta,
        })
            .addEventListener("click", async (e) => {
            await onAccept(e);
            this.close();
        });
    }
}
function createConfirmationDialog({ cta, onAccept, text, title, }) {
    new ConfirmationModal(window.app, { cta, onAccept, text, title }).open();
}

/**
 * Create a Daily Note for a given date.
 */
async function tryToCreateDailyNote(date, inNewSplit, settings, cb) {
    const { workspace } = window.app;
    const { format } = main.getDailyNoteSettings();
    const filename = date.format(format);
    const createFile = async () => {
        const dailyNote = await main.createDailyNote(date);
        const leaf = inNewSplit
            ? workspace.splitActiveLeaf()
            : workspace.getUnpinnedLeaf();
        await leaf.openFile(dailyNote);
        cb === null || cb === void 0 ? void 0 : cb(dailyNote);
    };
    if (settings.shouldConfirmBeforeCreate) {
        createConfirmationDialog({
            cta: "Create",
            onAccept: createFile,
            text: `File ${filename} does not exist. Would you like to create it?`,
            title: "New Daily Note",
        });
    }
    else {
        await createFile();
    }
}

function getNotePath(directory, filename) {
    if (!filename.endsWith(".md")) {
        filename += ".md";
    }
    return obsidian.normalizePath(path.join(directory, filename));
}

function getDayOfWeekNumericalValue(dayOfWeekName) {
    const daysOfWeek = window.moment
        .weekdays(true)
        .map((day) => day.toLowerCase());
    return daysOfWeek.indexOf(dayOfWeekName.toLowerCase());
}
async function createWeeklyNote(date, settings) {
    const { vault } = window.app;
    const { template, format, folder } = getWeeklyNoteSettings(settings);
    const templateContents = await main.getTemplateContents(template);
    const filename = date.format(format);
    const normalizedPath = getNotePath(folder, filename);
    try {
        const createdFile = await vault.create(normalizedPath, templateContents
            .replace(/{{\s*(date|time)\s*:(.*?)}}/gi, (_, _timeOrDate, momentFormat) => {
            return date.format(momentFormat.trim());
        })
            .replace(/{{\s*title\s*}}/gi, filename)
            .replace(/{{\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\s*:(.*?)}}/gi, (_, dayOfWeek, momentFormat) => {
            const day = getDayOfWeekNumericalValue(dayOfWeek);
            return date.weekday(day).format(momentFormat.trim());
        }));
        return createdFile;
    }
    catch (err) {
        console.error(`Failed to create file: '${normalizedPath}'`, err);
        new obsidian.Notice("Unable to create new file.");
    }
}
function getWeeklyNote(date, settings) {
    const { vault } = window.app;
    const startOfWeek = date.clone().weekday(0);
    const { format, folder } = getWeeklyNoteSettings(settings);
    const baseFilename = startOfWeek.format(format);
    const fullPath = getNotePath(folder, baseFilename);
    return vault.getAbstractFileByPath(fullPath);
}
/**
 * Create a Weekly Note for a given date.
 */
async function tryToCreateWeeklyNote(date, inNewSplit, settings, cb) {
    const { workspace } = window.app;
    const { format } = getWeeklyNoteSettings(settings);
    const filename = date.format(format);
    const createFile = async () => {
        const dailyNote = await createWeeklyNote(date, settings);
        const leaf = inNewSplit
            ? workspace.splitActiveLeaf()
            : workspace.getUnpinnedLeaf();
        await leaf.openFile(dailyNote);
        cb === null || cb === void 0 ? void 0 : cb();
    };
    if (settings.shouldConfirmBeforeCreate) {
        createConfirmationDialog({
            cta: "Create",
            onAccept: createFile,
            text: `File ${filename} does not exist. Would you like to create it?`,
            title: "New Daily Note",
        });
    }
    else {
        await createFile();
    }
}

const NUM_MAX_DOTS = 5;
function clamp(num, lowerBound, upperBound) {
    return Math.min(Math.max(lowerBound, num), upperBound);
}
function getWordCount(text) {
    const wordChars = /(?:[',.0-9;A-Z_a-z\xAA\xB2\xB3\xB5\xB9\xBA\xBC-\xBE\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0589\u05D0-\u05EA\u05EF-\u05F2\u060C\u060D\u0620-\u064A\u0660-\u0669\u066C\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07F8\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2018\u2019\u2024\u203F\u2040\u2044\u2054\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3192-\u3195\u31A0-\u31BA\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE10\uFE14\uFE33\uFE34\uFE4D-\uFE50\uFE52\uFE54\uFE70-\uFE74\uFE76-\uFEFC\uFF07\uFF0C\uFF0E\uFF10-\uFF19\uFF1B\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDE80-\uDE9C\uDEA0-\uDED0\uDEE1-\uDEFB\uDF00-\uDF23\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC58-\uDC76\uDC79-\uDC9E\uDCA7-\uDCAF\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDD1B\uDD20-\uDD39\uDD80-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE40-\uDE48\uDE60-\uDE7E\uDE80-\uDE9F\uDEC0-\uDEC7\uDEC9-\uDEE4\uDEEB-\uDEEF\uDF00-\uDF35\uDF40-\uDF55\uDF58-\uDF72\uDF78-\uDF91\uDFA9-\uDFAF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDD23\uDD30-\uDD39\uDE60-\uDE7E\uDF00-\uDF27\uDF30-\uDF45\uDF51-\uDF54]|\uD804[\uDC03-\uDC37\uDC52-\uDC6F\uDC83-\uDCAF\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD03-\uDD26\uDD36-\uDD3F\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDD0-\uDDDA\uDDDC\uDDE1-\uDDF4\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDEF0-\uDEF9\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC50-\uDC59\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE50-\uDE59\uDE80-\uDEAA\uDEC0-\uDEC9\uDF00-\uDF1A\uDF30-\uDF3B]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCF2\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC50-\uDC6C\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE96\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCC7-\uDCCF\uDD00-\uDD43\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD00-\uDD0C]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|[\u00AD\u2010\u2011]|\u002D(?!\u002D))+/g;
    return (text.match(wordChars) || []).length;
}
async function getNumberOfDots(note, settings) {
    if (!note || settings.wordsPerDot <= 0) {
        return 0;
    }
    const fileContents = await window.app.vault.cachedRead(note);
    const numDots = getWordCount(fileContents) / settings.wordsPerDot;
    return clamp(Math.floor(numDots), 1, NUM_MAX_DOTS);
}
async function getNumberOfRemainingTasks(note) {
    if (!note) {
        return 0;
    }
    const { vault } = window.app;
    const fileContents = await vault.cachedRead(note);
    return (fileContents.match(/(-|\*) \[ \]/g) || []).length;
}
function isMacOS() {
    return os.platform() === "darwin";
}
function isMetaPressed(e) {
    return isMacOS() ? e.metaKey : e.ctrlKey;
}
function getDaysOfWeek(_settings) {
    return window.moment.weekdaysShort(true);
}
function isWeekend(date) {
    return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}
/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
function getMonthData(activeFile, displayedMonth, settings) {
    const month = [];
    let week;
    const dailyNotes = main.getAllDailyNotes();
    const startOfMonth = displayedMonth.clone().date(1);
    const startOffset = startOfMonth.weekday();
    let date = startOfMonth.clone().subtract(startOffset, "days");
    for (let _day = 0; _day < 42; _day++) {
        if (_day % 7 === 0) {
            week = {
                days: [],
                weekNum: date.week(),
                weeklyNote: getWeeklyNote(date, settings),
            };
            month.push(week);
        }
        const note = main.getDailyNote(date, dailyNotes);
        week.days.push({
            date,
            note,
            isActive: activeFile && activeFile === (note === null || note === void 0 ? void 0 : note.basename),
            numDots: getNumberOfDots(note, settings),
            numTasksRemaining: getNumberOfRemainingTasks(note),
        });
        date = date.clone().add(1, "days");
    }
    return month;
}

/* src/ui/Day.svelte generated by Svelte v3.29.7 */

function add_css() {
	var style = element("style");
	style.id = "svelte-1ynt2s5-style";
	style.textContent = ".day.svelte-1ynt2s5.svelte-1ynt2s5{background-color:var(--color-background-day);border-radius:4px;color:var(--color-text-day);cursor:pointer;font-size:0.8em;height:100%;padding:4px;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}.day.svelte-1ynt2s5.svelte-1ynt2s5:hover{background-color:var(--interactive-hover)}.day.active.svelte-1ynt2s5.svelte-1ynt2s5:hover{background-color:var(--interactive-accent-hover)}.adjacent-month.svelte-1ynt2s5.svelte-1ynt2s5{opacity:0.25}.today.svelte-1ynt2s5.svelte-1ynt2s5{color:var(--color-text-today)}.active.svelte-1ynt2s5.svelte-1ynt2s5,.active.today.svelte-1ynt2s5.svelte-1ynt2s5{color:var(--text-on-accent);background-color:var(--interactive-accent)}.dot-container.svelte-1ynt2s5.svelte-1ynt2s5{display:flex;flex-wrap:wrap;justify-content:center;line-height:6px;min-height:6px}.dot.svelte-1ynt2s5.svelte-1ynt2s5,.task.svelte-1ynt2s5.svelte-1ynt2s5{display:inline-block;fill:var(--color-dot);height:6px;width:6px;margin:0 1px}.active.svelte-1ynt2s5 .dot.svelte-1ynt2s5{fill:var(--text-on-accent)}.task.svelte-1ynt2s5.svelte-1ynt2s5{fill:none;stroke:var(--color-dot)}.active.svelte-1ynt2s5 .task.svelte-1ynt2s5{stroke:var(--text-on-accent)}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

// (1:0) <script lang="ts">; ; import { getDailyNoteSettings }
function create_catch_block_1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (99:32)          {#each Array(dots) as _}
function create_then_block_1(ctx) {
	let each_1_anchor;
	let each_value = Array(/*dots*/ ctx[13]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*numDots*/ 16) {
				const old_length = each_value.length;
				each_value = Array(/*dots*/ ctx[13]);
				let i;

				for (i = old_length; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (!each_blocks[i]) {
						each_blocks[i] = create_each_block();
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (i = each_value.length; i < old_length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (100:8) {#each Array(dots) as _}
function create_each_block(ctx) {
	let svg;
	let circle;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", "dot svelte-1ynt2s5");
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

// (1:0) <script lang="ts">; ; import { getDailyNoteSettings }
function create_pending_block_1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (1:0) <script lang="ts">; ; import { getDailyNoteSettings }
function create_catch_block(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (106:45)          {#if hasTask}
function create_then_block(ctx) {
	let if_block_anchor;
	let if_block = /*hasTask*/ ctx[12] && create_if_block();

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*hasTask*/ ctx[12]) {
				if (if_block) ; else {
					if_block = create_if_block();
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (107:8) {#if hasTask}
function create_if_block(ctx) {
	let svg;
	let circle;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", "task svelte-1ynt2s5");
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

// (1:0) <script lang="ts">; ; import { getDailyNoteSettings }
function create_pending_block(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

function create_fragment(ctx) {
	let td;
	let div1;
	let t0_value = /*date*/ ctx[1].format("D") + "";
	let t0;
	let t1;
	let div0;
	let promise;
	let t2;
	let promise_1;
	let mounted;
	let dispose;

	let info = {
		ctx,
		current: null,
		token: null,
		hasCatch: false,
		pending: create_pending_block_1,
		then: create_then_block_1,
		catch: create_catch_block_1,
		value: 13
	};

	handle_promise(promise = /*numDots*/ ctx[4], info);

	let info_1 = {
		ctx,
		current: null,
		token: null,
		hasCatch: false,
		pending: create_pending_block,
		then: create_then_block,
		catch: create_catch_block,
		value: 12
	};

	handle_promise(promise_1 = /*numTasksRemaining*/ ctx[3], info_1);

	return {
		c() {
			td = element("td");
			div1 = element("div");
			t0 = text(t0_value);
			t1 = space();
			div0 = element("div");
			info.block.c();
			t2 = space();
			info_1.block.c();
			attr(div0, "class", "dot-container svelte-1ynt2s5");
			attr(div1, "class", "day svelte-1ynt2s5");
			toggle_class(div1, "adjacent-month", !/*date*/ ctx[1].isSame(/*displayedMonth*/ ctx[7], "month"));
			toggle_class(div1, "active", /*isActive*/ ctx[0]);
			toggle_class(div1, "today", /*date*/ ctx[1].isSame(/*today*/ ctx[8], "day"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, div1);
			append(div1, t0);
			append(div1, t1);
			append(div1, div0);
			info.block.m(div0, info.anchor = null);
			info.mount = () => div0;
			info.anchor = t2;
			append(div0, t2);
			info_1.block.m(div0, info_1.anchor = null);
			info_1.mount = () => div0;
			info_1.anchor = null;

			if (!mounted) {
				dispose = [
					listen(div1, "click", /*click_handler*/ ctx[10]),
					listen(div1, "pointerover", /*pointerover_handler*/ ctx[11])
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;
			if (dirty & /*date*/ 2 && t0_value !== (t0_value = /*date*/ ctx[1].format("D") + "")) set_data(t0, t0_value);
			info.ctx = ctx;

			if (dirty & /*numDots*/ 16 && promise !== (promise = /*numDots*/ ctx[4]) && handle_promise(promise, info)) ; else {
				const child_ctx = ctx.slice();
				child_ctx[13] = info.resolved;
				info.block.p(child_ctx, dirty);
			}

			info_1.ctx = ctx;

			if (dirty & /*numTasksRemaining*/ 8 && promise_1 !== (promise_1 = /*numTasksRemaining*/ ctx[3]) && handle_promise(promise_1, info_1)) ; else {
				const child_ctx = ctx.slice();
				child_ctx[12] = info_1.resolved;
				info_1.block.p(child_ctx, dirty);
			}

			if (dirty & /*date, displayedMonth*/ 130) {
				toggle_class(div1, "adjacent-month", !/*date*/ ctx[1].isSame(/*displayedMonth*/ ctx[7], "month"));
			}

			if (dirty & /*isActive*/ 1) {
				toggle_class(div1, "active", /*isActive*/ ctx[0]);
			}

			if (dirty & /*date, today*/ 258) {
				toggle_class(div1, "today", /*date*/ ctx[1].isSame(/*today*/ ctx[8], "day"));
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(td);
			info.block.d();
			info.token = null;
			info = null;
			info_1.block.d();
			info_1.token = null;
			info_1 = null;
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	
	
	const { format } = main.getDailyNoteSettings();
	let { isActive } = $$props;
	let { date } = $$props;
	let { note } = $$props;
	let { numTasksRemaining } = $$props;
	let { numDots } = $$props;
	let { onHover } = $$props;
	let { openOrCreateDailyNote } = $$props;
	let { displayedMonth } = $$props;
	let { today } = $$props;

	const click_handler = e => {
		openOrCreateDailyNote(date, note, isMetaPressed(e));
	};

	const pointerover_handler = e => {
		if (isMetaPressed(e)) {
			onHover(e.target, date.format(format), note);
		}
	};

	$$self.$$set = $$props => {
		if ("isActive" in $$props) $$invalidate(0, isActive = $$props.isActive);
		if ("date" in $$props) $$invalidate(1, date = $$props.date);
		if ("note" in $$props) $$invalidate(2, note = $$props.note);
		if ("numTasksRemaining" in $$props) $$invalidate(3, numTasksRemaining = $$props.numTasksRemaining);
		if ("numDots" in $$props) $$invalidate(4, numDots = $$props.numDots);
		if ("onHover" in $$props) $$invalidate(5, onHover = $$props.onHover);
		if ("openOrCreateDailyNote" in $$props) $$invalidate(6, openOrCreateDailyNote = $$props.openOrCreateDailyNote);
		if ("displayedMonth" in $$props) $$invalidate(7, displayedMonth = $$props.displayedMonth);
		if ("today" in $$props) $$invalidate(8, today = $$props.today);
	};

	return [
		isActive,
		date,
		note,
		numTasksRemaining,
		numDots,
		onHover,
		openOrCreateDailyNote,
		displayedMonth,
		today,
		format,
		click_handler,
		pointerover_handler
	];
}

class Day extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1ynt2s5-style")) add_css();

		init(this, options, instance, create_fragment, safe_not_equal, {
			isActive: 0,
			date: 1,
			note: 2,
			numTasksRemaining: 3,
			numDots: 4,
			onHover: 5,
			openOrCreateDailyNote: 6,
			displayedMonth: 7,
			today: 8
		});
	}
}

/* src/ui/WeekNum.svelte generated by Svelte v3.29.7 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-8sk2hp-style";
	style.textContent = ".week-num.svelte-8sk2hp.svelte-8sk2hp{background-color:var(--color-background-weeknum);border-radius:4px;color:var(--color-text-weeknum);cursor:pointer;font-size:0.65em;height:100%;padding:4px;text-align:center;transition:background-color 0.1s ease-in, color 0.1s ease-in;vertical-align:baseline}td.svelte-8sk2hp.svelte-8sk2hp{border-right:1px solid var(--background-modifier-border)}.week-num.svelte-8sk2hp.svelte-8sk2hp:hover{background-color:var(--interactive-hover)}.week-num.active.svelte-8sk2hp.svelte-8sk2hp:hover{background-color:var(--interactive-accent-hover)}.active.svelte-8sk2hp.svelte-8sk2hp{color:var(--text-on-accent);background-color:var(--interactive-accent)}.dot-container.svelte-8sk2hp.svelte-8sk2hp{display:flex;flex-wrap:wrap;justify-content:center;line-height:6px;min-height:6px}.dot.svelte-8sk2hp.svelte-8sk2hp,.task.svelte-8sk2hp.svelte-8sk2hp{display:inline-block;fill:var(--color-dot);height:6px;width:6px;margin:0 1px}.active.svelte-8sk2hp .dot.svelte-8sk2hp{fill:var(--text-on-accent)}.task.svelte-8sk2hp.svelte-8sk2hp{fill:none;stroke:var(--color-dot)}.active.svelte-8sk2hp .task.svelte-8sk2hp{stroke:var(--text-on-accent)}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

// (1:0) <script lang="ts">; ; ; import { getNumberOfDots, getNumberOfRemainingTasks, IDay, isMetaPressed, }
function create_catch_block_1$1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (94:62)          {#each Array(dots) as _}
function create_then_block_1$1(ctx) {
	let each_1_anchor;
	let each_value = Array(/*dots*/ ctx[13]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*weeklyNote, settings*/ 5) {
				const old_length = each_value.length;
				each_value = Array(/*dots*/ ctx[13]);
				let i;

				for (i = old_length; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (!each_blocks[i]) {
						each_blocks[i] = create_each_block$1();
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (i = each_value.length; i < old_length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (95:8) {#each Array(dots) as _}
function create_each_block$1(ctx) {
	let svg;
	let circle;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", "dot svelte-8sk2hp");
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

// (1:0) <script lang="ts">; ; ; import { getNumberOfDots, getNumberOfRemainingTasks, IDay, isMetaPressed, }
function create_pending_block_1$1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (1:0) <script lang="ts">; ; ; import { getNumberOfDots, getNumberOfRemainingTasks, IDay, isMetaPressed, }
function create_catch_block$1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

// (101:65)          {#if hasTask}
function create_then_block$1(ctx) {
	let if_block_anchor;
	let if_block = /*hasTask*/ ctx[12] && create_if_block$1();

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*hasTask*/ ctx[12]) {
				if (if_block) ; else {
					if_block = create_if_block$1();
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (102:8) {#if hasTask}
function create_if_block$1(ctx) {
	let svg;
	let circle;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", "task svelte-8sk2hp");
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

// (1:0) <script lang="ts">; ; ; import { getNumberOfDots, getNumberOfRemainingTasks, IDay, isMetaPressed, }
function create_pending_block$1(ctx) {
	return { c: noop, m: noop, p: noop, d: noop };
}

function create_fragment$1(ctx) {
	let td;
	let div1;
	let t0;
	let t1;
	let div0;
	let promise;
	let t2;
	let promise_1;
	let mounted;
	let dispose;

	let info = {
		ctx,
		current: null,
		token: null,
		hasCatch: false,
		pending: create_pending_block_1$1,
		then: create_then_block_1$1,
		catch: create_catch_block_1$1,
		value: 13
	};

	handle_promise(promise = getNumberOfDots(/*weeklyNote*/ ctx[0], /*settings*/ ctx[2]), info);

	let info_1 = {
		ctx,
		current: null,
		token: null,
		hasCatch: false,
		pending: create_pending_block$1,
		then: create_then_block$1,
		catch: create_catch_block$1,
		value: 12
	};

	handle_promise(promise_1 = getNumberOfRemainingTasks(/*weeklyNote*/ ctx[0]), info_1);

	return {
		c() {
			td = element("td");
			div1 = element("div");
			t0 = text(/*weekNum*/ ctx[1]);
			t1 = space();
			div0 = element("div");
			info.block.c();
			t2 = space();
			info_1.block.c();
			attr(div0, "class", "dot-container svelte-8sk2hp");
			attr(div1, "class", "week-num svelte-8sk2hp");
			toggle_class(div1, "active", /*isActive*/ ctx[5]);
			attr(td, "class", "svelte-8sk2hp");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, div1);
			append(div1, t0);
			append(div1, t1);
			append(div1, div0);
			info.block.m(div0, info.anchor = null);
			info.mount = () => div0;
			info.anchor = t2;
			append(div0, t2);
			info_1.block.m(div0, info_1.anchor = null);
			info_1.mount = () => div0;
			info_1.anchor = null;

			if (!mounted) {
				dispose = [
					listen(div1, "click", /*click_handler*/ ctx[10]),
					listen(div1, "pointerover", /*pointerover_handler*/ ctx[11])
				];

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;
			if (dirty & /*weekNum*/ 2) set_data(t0, /*weekNum*/ ctx[1]);
			info.ctx = ctx;

			if (dirty & /*weeklyNote, settings*/ 5 && promise !== (promise = getNumberOfDots(/*weeklyNote*/ ctx[0], /*settings*/ ctx[2])) && handle_promise(promise, info)) ; else {
				const child_ctx = ctx.slice();
				child_ctx[13] = info.resolved;
				info.block.p(child_ctx, dirty);
			}

			info_1.ctx = ctx;

			if (dirty & /*weeklyNote*/ 1 && promise_1 !== (promise_1 = getNumberOfRemainingTasks(/*weeklyNote*/ ctx[0])) && handle_promise(promise_1, info_1)) ; else {
				const child_ctx = ctx.slice();
				child_ctx[12] = info_1.resolved;
				info_1.block.p(child_ctx, dirty);
			}

			if (dirty & /*isActive*/ 32) {
				toggle_class(div1, "active", /*isActive*/ ctx[5]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(td);
			info.block.d();
			info.token = null;
			info = null;
			info_1.block.d();
			info_1.token = null;
			info_1 = null;
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	
	
	
	let { weeklyNote } = $$props;
	let { weekNum } = $$props;
	let { days } = $$props;
	let { activeFile } = $$props;
	let { settings } = $$props;
	let { onHover } = $$props;
	let { openOrCreateWeeklyNote } = $$props;
	let isActive;
	const startOfWeek = days[0].date.weekday(0);
	const formattedDate = startOfWeek.format(settings.weeklyNoteFormat);

	const click_handler = e => {
		openOrCreateWeeklyNote(startOfWeek, weeklyNote, isMetaPressed(e));
	};

	const pointerover_handler = e => {
		if (isMetaPressed(e)) {
			onHover(e.target, formattedDate, weeklyNote);
		}
	};

	$$self.$$set = $$props => {
		if ("weeklyNote" in $$props) $$invalidate(0, weeklyNote = $$props.weeklyNote);
		if ("weekNum" in $$props) $$invalidate(1, weekNum = $$props.weekNum);
		if ("days" in $$props) $$invalidate(8, days = $$props.days);
		if ("activeFile" in $$props) $$invalidate(9, activeFile = $$props.activeFile);
		if ("settings" in $$props) $$invalidate(2, settings = $$props.settings);
		if ("onHover" in $$props) $$invalidate(3, onHover = $$props.onHover);
		if ("openOrCreateWeeklyNote" in $$props) $$invalidate(4, openOrCreateWeeklyNote = $$props.openOrCreateWeeklyNote);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*activeFile, weeklyNote*/ 513) {
			 $$invalidate(5, isActive = activeFile && (weeklyNote === null || weeklyNote === void 0
			? void 0
			: weeklyNote.basename) === activeFile);
		}
	};

	return [
		weeklyNote,
		weekNum,
		settings,
		onHover,
		openOrCreateWeeklyNote,
		isActive,
		startOfWeek,
		formattedDate,
		days,
		activeFile,
		click_handler,
		pointerover_handler
	];
}

class WeekNum extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-8sk2hp-style")) add_css$1();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			weeklyNote: 0,
			weekNum: 1,
			days: 8,
			activeFile: 9,
			settings: 2,
			onHover: 3,
			openOrCreateWeeklyNote: 4
		});
	}
}

/* src/ui/Calendar.svelte generated by Svelte v3.29.7 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-1mq3tzu-style";
	style.textContent = ".container.svelte-1mq3tzu.svelte-1mq3tzu{--color-background-heading:transparent;--color-background-day:transparent;--color-background-weeknum:transparent;--color-background-weekend:transparent;--color-dot:var(--text-muted);--color-arrow:var(--text-muted);--color-button:var(--text-muted);--color-text-title:var(--text-normal);--color-text-heading:var(--text-muted);--color-text-day:var(--text-normal);--color-text-today:var(--interactive-accent);--color-text-weeknum:var(--text-muted)}.container.svelte-1mq3tzu.svelte-1mq3tzu{padding:0 8px}th.svelte-1mq3tzu.svelte-1mq3tzu{text-align:center}.nav.svelte-1mq3tzu.svelte-1mq3tzu{align-items:center;display:flex;margin:0.6em 0 1em;padding:0 8px;width:100%}.title.svelte-1mq3tzu.svelte-1mq3tzu{color:var(--color-text-title);font-size:1.5em;margin:0}.month.svelte-1mq3tzu.svelte-1mq3tzu{font-weight:500;text-transform:capitalize}.year.svelte-1mq3tzu.svelte-1mq3tzu{color:var(--interactive-accent)}.right-nav.svelte-1mq3tzu.svelte-1mq3tzu{display:flex;justify-content:center;margin-left:auto}.reset-button.svelte-1mq3tzu.svelte-1mq3tzu{border-radius:4px;color:var(--text-muted);font-size:0.7em;font-weight:600;letter-spacing:1px;margin:0 4px;padding:0px 4px;text-transform:uppercase}.weekend.svelte-1mq3tzu.svelte-1mq3tzu{background-color:var(--color-background-weekend)}.calendar.svelte-1mq3tzu.svelte-1mq3tzu{border-collapse:collapse;width:100%}th.svelte-1mq3tzu.svelte-1mq3tzu{background-color:var(--color-background-heading);color:var(--color-text-heading);font-size:0.6rem;letter-spacing:1px;padding:4px 8px;text-transform:uppercase}.arrow.svelte-1mq3tzu.svelte-1mq3tzu{align-items:center;cursor:pointer;display:flex;justify-content:center;width:24px}.arrow.svelte-1mq3tzu svg.svelte-1mq3tzu{color:var(--color-arrow);height:16px;width:16px}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[22] = list[i];
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i];
	return child_ctx;
}

// (182:6) {#if settings.showWeeklyNote}
function create_if_block_2(ctx) {
	let col;

	return {
		c() {
			col = element("col");
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		d(detaching) {
			if (detaching) detach(col);
		}
	};
}

// (185:6) {#each month[1].days as day}
function create_each_block_3(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-1mq3tzu");
			toggle_class(col, "weekend", isWeekend(/*day*/ ctx[19].date));
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*isWeekend, month*/ 32) {
				toggle_class(col, "weekend", isWeekend(/*day*/ ctx[19].date));
			}
		},
		d(detaching) {
			if (detaching) detach(col);
		}
	};
}

// (191:8) {#if settings.showWeeklyNote}
function create_if_block_1(ctx) {
	let th;

	return {
		c() {
			th = element("th");
			th.textContent = "W";
			attr(th, "class", "svelte-1mq3tzu");
		},
		m(target, anchor) {
			insert(target, th, anchor);
		},
		d(detaching) {
			if (detaching) detach(th);
		}
	};
}

// (194:8) {#each daysOfWeek as dayOfWeek}
function create_each_block_2(ctx) {
	let th;
	let t_value = /*dayOfWeek*/ ctx[22] + "";
	let t;

	return {
		c() {
			th = element("th");
			t = text(t_value);
			attr(th, "class", "svelte-1mq3tzu");
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t);
		},
		p(ctx, dirty) {
			if (dirty & /*daysOfWeek*/ 64 && t_value !== (t_value = /*dayOfWeek*/ ctx[22] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(th);
		}
	};
}

// (202:10) {#if settings.showWeeklyNote}
function create_if_block$2(ctx) {
	let weeknum;
	let current;

	const weeknum_spread_levels = [
		/*week*/ ctx[16],
		{ activeFile: /*activeFile*/ ctx[1] },
		{ onHover: /*onHover*/ ctx[2] },
		{
			openOrCreateWeeklyNote: /*openOrCreateWeeklyNote*/ ctx[4]
		},
		{ settings: /*settings*/ ctx[8] }
	];

	let weeknum_props = {};

	for (let i = 0; i < weeknum_spread_levels.length; i += 1) {
		weeknum_props = assign(weeknum_props, weeknum_spread_levels[i]);
	}

	weeknum = new WeekNum({ props: weeknum_props });

	return {
		c() {
			create_component(weeknum.$$.fragment);
		},
		m(target, anchor) {
			mount_component(weeknum, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const weeknum_changes = (dirty & /*month, activeFile, onHover, openOrCreateWeeklyNote, settings*/ 310)
			? get_spread_update(weeknum_spread_levels, [
					dirty & /*month*/ 32 && get_spread_object(/*week*/ ctx[16]),
					dirty & /*activeFile*/ 2 && { activeFile: /*activeFile*/ ctx[1] },
					dirty & /*onHover*/ 4 && { onHover: /*onHover*/ ctx[2] },
					dirty & /*openOrCreateWeeklyNote*/ 16 && {
						openOrCreateWeeklyNote: /*openOrCreateWeeklyNote*/ ctx[4]
					},
					dirty & /*settings*/ 256 && { settings: /*settings*/ ctx[8] }
				])
			: {};

			weeknum.$set(weeknum_changes);
		},
		i(local) {
			if (current) return;
			transition_in(weeknum.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(weeknum.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(weeknum, detaching);
		}
	};
}

// (210:10) {#each week.days as day}
function create_each_block_1(ctx) {
	let day;
	let current;

	const day_spread_levels = [
		/*day*/ ctx[19],
		{ onHover: /*onHover*/ ctx[2] },
		{
			openOrCreateDailyNote: /*openOrCreateDailyNote*/ ctx[3]
		},
		{ today: /*today*/ ctx[7] },
		{
			displayedMonth: /*displayedMonth*/ ctx[0]
		}
	];

	let day_props = {};

	for (let i = 0; i < day_spread_levels.length; i += 1) {
		day_props = assign(day_props, day_spread_levels[i]);
	}

	day = new Day({ props: day_props });

	return {
		c() {
			create_component(day.$$.fragment);
		},
		m(target, anchor) {
			mount_component(day, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const day_changes = (dirty & /*month, onHover, openOrCreateDailyNote, today, displayedMonth*/ 173)
			? get_spread_update(day_spread_levels, [
					dirty & /*month*/ 32 && get_spread_object(/*day*/ ctx[19]),
					dirty & /*onHover*/ 4 && { onHover: /*onHover*/ ctx[2] },
					dirty & /*openOrCreateDailyNote*/ 8 && {
						openOrCreateDailyNote: /*openOrCreateDailyNote*/ ctx[3]
					},
					dirty & /*today*/ 128 && { today: /*today*/ ctx[7] },
					dirty & /*displayedMonth*/ 1 && {
						displayedMonth: /*displayedMonth*/ ctx[0]
					}
				])
			: {};

			day.$set(day_changes);
		},
		i(local) {
			if (current) return;
			transition_in(day.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(day.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(day, detaching);
		}
	};
}

// (200:6) {#each month as week}
function create_each_block$2(ctx) {
	let tr;
	let t0;
	let t1;
	let current;
	let if_block = /*settings*/ ctx[8].showWeeklyNote && create_if_block$2(ctx);
	let each_value_1 = /*week*/ ctx[16].days;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			tr = element("tr");
			if (if_block) if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			if (if_block) if_block.m(tr, null);
			append(tr, t0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tr, null);
			}

			append(tr, t1);
			current = true;
		},
		p(ctx, dirty) {
			if (/*settings*/ ctx[8].showWeeklyNote) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*settings*/ 256) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(tr, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*month, onHover, openOrCreateDailyNote, today, displayedMonth*/ 173) {
				each_value_1 = /*week*/ ctx[16].days;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tr, t1);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(if_block);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let div5;
	let div4;
	let h3;
	let span0;
	let t0_value = /*displayedMonth*/ ctx[0].format("MMM") + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*displayedMonth*/ ctx[0].format("YYYY") + "";
	let t2;
	let t3;
	let div3;
	let div0;
	let t4;
	let div1;
	let t6;
	let div2;
	let t7;
	let table;
	let colgroup;
	let t8;
	let t9;
	let thead;
	let tr;
	let t10;
	let t11;
	let tbody;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*settings*/ ctx[8].showWeeklyNote && create_if_block_2();
	let each_value_3 = /*month*/ ctx[5][1].days;
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let if_block1 = /*settings*/ ctx[8].showWeeklyNote && create_if_block_1();
	let each_value_2 = /*daysOfWeek*/ ctx[6];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	let each_value = /*month*/ ctx[5];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div5 = element("div");
			div4 = element("div");
			h3 = element("h3");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			div3 = element("div");
			div0 = element("div");
			div0.innerHTML = `<svg focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="svelte-1mq3tzu"><path fill="currentColor" d="M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z"></path></svg>`;
			t4 = space();
			div1 = element("div");
			div1.textContent = `${/*todayDisplayStr*/ ctx[9]}`;
			t6 = space();
			div2 = element("div");
			div2.innerHTML = `<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="svelte-1mq3tzu"><path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg>`;
			t7 = space();
			table = element("table");
			colgroup = element("colgroup");
			if (if_block0) if_block0.c();
			t8 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t9 = space();
			thead = element("thead");
			tr = element("tr");
			if (if_block1) if_block1.c();
			t10 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t11 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(span0, "class", "month svelte-1mq3tzu");
			attr(span1, "class", "year svelte-1mq3tzu");
			attr(h3, "class", "title svelte-1mq3tzu");
			attr(div0, "class", "arrow svelte-1mq3tzu");
			attr(div0, "aria-label", "Previous Month");
			attr(div1, "class", "reset-button svelte-1mq3tzu");
			attr(div2, "class", "arrow svelte-1mq3tzu");
			attr(div2, "aria-label", "Next Month");
			attr(div3, "class", "right-nav svelte-1mq3tzu");
			attr(div4, "class", "nav svelte-1mq3tzu");
			attr(table, "class", "calendar svelte-1mq3tzu");
			attr(div5, "id", "calendar-container");
			attr(div5, "class", "container svelte-1mq3tzu");
		},
		m(target, anchor) {
			insert(target, div5, anchor);
			append(div5, div4);
			append(div4, h3);
			append(h3, span0);
			append(span0, t0);
			append(h3, t1);
			append(h3, span1);
			append(span1, t2);
			append(div4, t3);
			append(div4, div3);
			append(div3, div0);
			append(div3, t4);
			append(div3, div1);
			append(div3, t6);
			append(div3, div2);
			append(div5, t7);
			append(div5, table);
			append(table, colgroup);
			if (if_block0) if_block0.m(colgroup, null);
			append(colgroup, t8);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(colgroup, null);
			}

			append(table, t9);
			append(table, thead);
			append(thead, tr);
			if (if_block1) if_block1.m(tr, null);
			append(tr, t10);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(tr, null);
			}

			append(table, t11);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					listen(h3, "click", /*focusCurrentMonth*/ ctx[12]),
					listen(div0, "click", /*decrementMonth*/ ctx[11]),
					listen(div1, "click", /*focusCurrentMonth*/ ctx[12]),
					listen(div2, "click", /*incrementMonth*/ ctx[10])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*displayedMonth*/ 1) && t0_value !== (t0_value = /*displayedMonth*/ ctx[0].format("MMM") + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*displayedMonth*/ 1) && t2_value !== (t2_value = /*displayedMonth*/ ctx[0].format("YYYY") + "")) set_data(t2, t2_value);

			if (/*settings*/ ctx[8].showWeeklyNote) {
				if (if_block0) ; else {
					if_block0 = create_if_block_2();
					if_block0.c();
					if_block0.m(colgroup, t8);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty & /*isWeekend, month*/ 32) {
				each_value_3 = /*month*/ ctx[5][1].days;
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_3(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(colgroup, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_3.length;
			}

			if (/*settings*/ ctx[8].showWeeklyNote) {
				if (if_block1) ; else {
					if_block1 = create_if_block_1();
					if_block1.c();
					if_block1.m(tr, t10);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*daysOfWeek*/ 64) {
				each_value_2 = /*daysOfWeek*/ ctx[6];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_2.length;
			}

			if (dirty & /*month, onHover, openOrCreateDailyNote, today, displayedMonth, activeFile, openOrCreateWeeklyNote, settings*/ 447) {
				each_value = /*month*/ ctx[5];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div5);
			if (if_block0) if_block0.d();
			destroy_each(each_blocks_2, detaching);
			if (if_block1) if_block1.d();
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	
	
	const moment = window.moment;
	let { activeFile = null } = $$props;
	let { onHover } = $$props;
	let { displayedMonth = moment() } = $$props;
	let { openOrCreateDailyNote } = $$props;
	let { openOrCreateWeeklyNote } = $$props;
	let month;
	let daysOfWeek;
	let today = moment();
	let settings = null;

	let settingsUnsubscribe = SettingsInstance.subscribe(value => {
		$$invalidate(8, settings = value);
	});

	// Get the word 'Today' but localized to the current language
	const todayDisplayStr = today.calendar().split(" ")[0];

	function incrementMonth() {
		$$invalidate(0, displayedMonth = displayedMonth.add(1, "months"));
	}

	function decrementMonth() {
		$$invalidate(0, displayedMonth = displayedMonth.subtract(1, "months"));
	}

	function focusCurrentMonth() {
		$$invalidate(0, displayedMonth = today.clone());
	}

	// 1 minute heartbeat to keep `today` reflecting the current day
	let heartbeat = setInterval(
		() => {
			const isViewingCurrentMonth = today.isSame(displayedMonth, "day");
			$$invalidate(7, today = moment());

			if (isViewingCurrentMonth) {
				// if it's midnight on the last day of the month, this will
				// update the display to show the new month.
				$$invalidate(0, displayedMonth = today.clone());
			}
		},
		1000 * 60
	);

	onDestroy(() => {
		settingsUnsubscribe();
		clearInterval(heartbeat);
	});

	$$self.$$set = $$props => {
		if ("activeFile" in $$props) $$invalidate(1, activeFile = $$props.activeFile);
		if ("onHover" in $$props) $$invalidate(2, onHover = $$props.onHover);
		if ("displayedMonth" in $$props) $$invalidate(0, displayedMonth = $$props.displayedMonth);
		if ("openOrCreateDailyNote" in $$props) $$invalidate(3, openOrCreateDailyNote = $$props.openOrCreateDailyNote);
		if ("openOrCreateWeeklyNote" in $$props) $$invalidate(4, openOrCreateWeeklyNote = $$props.openOrCreateWeeklyNote);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*settings, activeFile, displayedMonth*/ 259) {
			 {
				$$invalidate(6, daysOfWeek = getDaysOfWeek());
				$$invalidate(5, month = getMonthData(activeFile, displayedMonth, settings));
			}
		}
	};

	return [
		displayedMonth,
		activeFile,
		onHover,
		openOrCreateDailyNote,
		openOrCreateWeeklyNote,
		month,
		daysOfWeek,
		today,
		settings,
		todayDisplayStr,
		incrementMonth,
		decrementMonth,
		focusCurrentMonth
	];
}

class Calendar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1mq3tzu-style")) add_css$2();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			activeFile: 1,
			onHover: 2,
			displayedMonth: 0,
			openOrCreateDailyNote: 3,
			openOrCreateWeeklyNote: 4
		});
	}
}

class CalendarView extends obsidian.ItemView {
    constructor(leaf, settings) {
        super(leaf);
        this.settings = settings;
        this._openOrCreateDailyNote = this._openOrCreateDailyNote.bind(this);
        this.openOrCreateWeeklyNote = this.openOrCreateWeeklyNote.bind(this);
        this.redraw = this.redraw.bind(this);
        this.onHover = this.onHover.bind(this);
        this.registerEvent(this.app.workspace.on("file-open", this.redraw));
        this.registerEvent(this.app.workspace.on("quick-preview", this.redraw));
        this.registerEvent(this.app.vault.on("delete", this.redraw));
    }
    getViewType() {
        return VIEW_TYPE_CALENDAR;
    }
    getDisplayText() {
        return "Calendar";
    }
    getIcon() {
        return "calendar-with-checkmark";
    }
    onClose() {
        if (this.calendar) {
            this.calendar.$destroy();
        }
        return Promise.resolve();
    }
    onHover(targetEl, filename, note) {
        this.app.workspace.trigger("link-hover", this, targetEl, filename, note === null || note === void 0 ? void 0 : note.path);
    }
    async onOpen() {
        var _a;
        const activeLeaf = this.app.workspace.activeLeaf;
        const activeFile = activeLeaf
            ? (_a = activeLeaf.view.file) === null || _a === void 0 ? void 0 : _a.path : null;
        this.calendar = new Calendar({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            target: this.contentEl,
            props: {
                activeFile,
                openOrCreateDailyNote: this._openOrCreateDailyNote,
                openOrCreateWeeklyNote: this.openOrCreateWeeklyNote,
                onHover: this.onHover,
            },
        });
    }
    async redraw() {
        var _a;
        if (this.calendar) {
            const { workspace } = this.app;
            const view = workspace.activeLeaf.view;
            let activeFile = null;
            if (view instanceof obsidian.FileView) {
                activeFile = (_a = view.file) === null || _a === void 0 ? void 0 : _a.basename;
            }
            this.calendar.$set({ activeFile });
        }
    }
    revealActiveNote() {
        const { moment } = window;
        const { activeLeaf } = this.app.workspace;
        if (activeLeaf.view instanceof obsidian.FileView) {
            const { format } = main.getDailyNoteSettings();
            const displayedMonth = moment(activeLeaf.view.file.basename, format, true);
            if (displayedMonth.isValid()) {
                this.calendar.$set({ displayedMonth });
            }
        }
    }
    async openOrCreateWeeklyNote(date, existingFile, inNewSplit) {
        const { workspace } = this.app;
        const startOfWeek = date.clone().weekday(0);
        const { format } = getWeeklyNoteSettings(this.settings);
        const baseFilename = startOfWeek.format(format);
        if (!existingFile) {
            // File doesn't exist
            tryToCreateWeeklyNote(startOfWeek, inNewSplit, this.settings, () => {
                this.calendar.$set({ activeFile: baseFilename });
            });
            return;
        }
        const leaf = inNewSplit
            ? workspace.splitActiveLeaf()
            : workspace.getUnpinnedLeaf();
        await leaf.openFile(existingFile);
        this.calendar.$set({
            activeFile: existingFile.basename,
        });
    }
    async _openOrCreateDailyNote(date, existingFile, inNewSplit) {
        const { workspace } = this.app;
        if (!existingFile) {
            // File doesn't exist
            tryToCreateDailyNote(date, inNewSplit, this.settings, (dailyNote) => {
                this.calendar.$set({ activeFile: dailyNote.basename });
            });
            return;
        }
        const leaf = inNewSplit
            ? workspace.splitActiveLeaf()
            : workspace.getUnpinnedLeaf();
        await leaf.openFile(existingFile);
        this.calendar.$set({
            activeFile: existingFile.basename,
        });
    }
}

function configureMomentLocale() {
    const lang = localStorage.getItem("language");
    const currentLocale = window.moment.locale(lang);
    console.info(`trying to switch moment locale to ${lang}, got ${currentLocale}`);
}
class CalendarPlugin extends obsidian.Plugin {
    onunload() {
        this.app.workspace
            .getLeavesOfType(VIEW_TYPE_CALENDAR)
            .forEach((leaf) => leaf.detach());
    }
    async onload() {
        configureMomentLocale();
        this.register(SettingsInstance.subscribe((value) => {
            this.options = value;
        }));
        this.registerView(VIEW_TYPE_CALENDAR, (leaf) => (this.view = new CalendarView(leaf, this.options)));
        this.addCommand({
            id: "show-calendar-view",
            name: "Open view",
            checkCallback: (checking) => {
                if (checking) {
                    return (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length === 0);
                }
                this.initLeaf();
            },
        });
        this.addCommand({
            id: "open-weekly-note",
            name: "Open Weekly Note",
            callback: () => this.view.openOrCreateWeeklyNote(window.moment(), null, false),
        });
        this.addCommand({
            id: "reload-calendar-view",
            name: "Reload daily note settings",
            callback: () => this.view.redraw(),
        });
        this.addCommand({
            id: "reveal-active-note",
            name: "Reveal active note",
            callback: () => this.view.revealActiveNote(),
        });
        await this.loadOptions();
        // After we retrieve the settings, override window.moment to
        // reflect 'start week on monday' setting
        syncMomentLocaleWithSettings(this.options);
        this.addSettingTab(new CalendarSettingsTab(this.app, this));
        if (this.app.workspace.layoutReady) {
            this.initLeaf();
        }
        else {
            this.registerEvent(this.app.workspace.on("layout-ready", this.initLeaf.bind(this)));
        }
    }
    initLeaf() {
        if (this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR).length) {
            return;
        }
        this.app.workspace.getRightLeaf(false).setViewState({
            type: VIEW_TYPE_CALENDAR,
        });
    }
    async loadOptions() {
        const options = await this.loadData();
        SettingsInstance.update((old) => {
            return Object.assign(Object.assign({}, old), (options || {}));
        });
        await this.saveData(this.options);
    }
    async writeOptions(changeOpts) {
        SettingsInstance.update((old) => {
            changeOpts(old);
            return old;
        });
        syncMomentLocaleWithSettings(this.options);
        await this.saveData(this.options);
    }
}

module.exports = CalendarPlugin;
