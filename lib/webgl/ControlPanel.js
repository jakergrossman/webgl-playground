/**
 * Control panel wrapper
 *
 * Create and instantiate in the DOM a control panel `form`
 * tag, where each element is wrapped in a `div` tag.
 */
export class ControlPanel {
    /**
     * Create a new `ControlPanel`
     *
     * @param {Object[]} controlSpecifiers A list of objects to create control elements from.
     *                                     At a minimum contains a `type` property to know which to instantiate,
     *                                     and additionally any properties expected by the respective control element
     * @param {String} htmlId The `id` property to add to the resulting `form`
     */
    constructor(controlSpecifiers, htmlId="controls") {
        this.htmlId = htmlId;

        this.elements = {}; // list of Controls

        this.form = null;

        for (const spec of controlSpecifiers) {
            const name = spec.name;
            const type = spec.type;
            let control = null;
            switch (type) {
                case "range":
                    control = new RangeControl(name, spec);
                    break;
                case "checkbox":
                    control = new CheckboxControl(name);
                    break;
                case "button":
                    control = new ButtonControl(name);
                    break;
                case "info":
                    control = new InfoDisplay(name, spec);
                    break;
                case "divider":
                    control = new Divider();
                    break;
                case "label":
                    control = new ControlText(spec);
                    break;
            }
            this._addControl(control);
        }
    }

    /**
     * Add an instantiated control element by name
     *
     * @param {Control} control A control to register
     */
    _addControl(control) {
        this.elements[control.name] = control;
    }

    /**
     * Generate HTML for the currently registered form elements,
     * then emplace them in the DOM as a child to `parentHtmlNode`
     *
     * @param {HTMLElement} parentHtmlNode The parent to place the form under
     */
     instantiate(parentHtmlNode=document.body) {
        const form = document.createElement("form");
        form.id = this.htmlId;
        form.autocomplete = "off";

        for (const e of Object.entries(this.elements)) {
            const [name, control] = e;
            switch (control.type) {
                case "divider": {
                    // divider
                    const htmlNode = document.createElement("hr");
                    form.appendChild(htmlNode);
                    break;
                }
                case "label": {
                    const htmlNode = document.createElement("label");
                    htmlNode.id = control.id;
                    htmlNode.innerText = control.text;
                    form.appendChild(htmlNode);
                    break;
                }
                case "button": {
                    let div = document.createElement("div");
                    const label = document.createElement("label"); /* empty label */
                    const htmlNode = document.createElement("input");

                    htmlNode.type = control.type;
                    htmlNode.value = control.name;
                    htmlNode.id = control.name + "Button";

                    div.appendChild(label);
                    div.appendChild(htmlNode);
                    form.appendChild(div);

                    this[control.name + "Button"] = htmlNode;
                    break;
                }
                case "display": {
                    let div = document.createElement("div");

                    let label = document.createElement("label");
                    label.innerText = name;
                    let span = document.createElement("span");
                    span.id = name + "Display";
                    span.innerText = control.text;

                    div.appendChild(label);
                    div.appendChild(span);
                    form.appendChild(div);

                    this[name + "Display"] = span;
                    break;
                }
                default:  {
                    let div = document.createElement("div");
                    let label = document.createElement("label");
                    label.for = name + "Display";
                    label.innerText = name;

                    let input = document.createElement("input");
                    input.id = name + "Control";
                    input.type = control.type;

                    for (const [attribute, value] of Object.entries(control.htmlAttributes)) {
                        input[attribute] = value;
                    }

                    let span = document.createElement("span");
                    span.id = name + "Display";
                    if (control.htmlAttributes.value) {
                        span.innerText = control.htmlAttributes.value;
                    }

                    div.appendChild(label);
                    div.appendChild(input);
                    div.appendChild(span);
                    form.appendChild(div);

                    this[name+"Control"] = input;
                    this[name+"Display"] = span;
                }
            }
        }

        parentHtmlNode.appendChild(form);
        this.form = form;

        return this;
    }
}

/**
 * Base Control Element class
 */
class ControlElement {
    constructor(name, type) {
        this.name = name;
        this.type = type;

        this.htmlAttributes = {};
    }
}

/**
 * Range slider
 */
class RangeControl extends ControlElement {
    static defaultOptions = { min: 0, max: 1, step: 0.01 };
    constructor(name, opts) {
        super(name, "range");
        delete opts.name;
        this.htmlAttributes = {...RangeControl.defaultOptions, ...opts };
    }
}

/**
 * Checkbox Button
 */
class CheckboxControl extends ControlElement {
    constructor(name) {
        super(name, "checkbox");
    }
}

class ButtonControl extends ControlElement {
    constructor(name) {
        super(name, "button");
    }
}

/**
 * Label with data
 */
class InfoDisplay extends ControlElement {
    constructor(name, opts) {
        super(name, "display");
        this.text = opts.text;
    }
}

/**
 * Horizontal rule
 */
class Divider extends ControlElement {
    static dividerNum = 0;
    constructor() {
        super("hr" + (Divider.dividerNum++), "divider");
    }
}

/**
 * Text only
 */
class ControlText extends ControlElement {
    constructor(opts) {
        super(opts.id, "label");
        this.id = opts.id;
        this.text = opts.text;
    }
}

