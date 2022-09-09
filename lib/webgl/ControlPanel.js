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
     instantiate(classes, parentHtmlNode=document.body) {
        const form = document.createElement("form");
        if (classes) {
            classes.map(n=>form.classList.add(n));
        }
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
                    const htmlNode = document.createElement("input");

                    htmlNode.type = control.type;
                    htmlNode.value = control.name;
                    htmlNode.id = control.name + "Button";

                    div.appendChild(htmlNode);
                    form.appendChild(div);

                    this[control.name + "Button"] = htmlNode;
                    break;
                }
                case "checkbox": {
                    let div = document.createElement("div");
                    let label = document.createElement("label");
                    label.innerText = control.name;
                    const htmlNode = document.createElement("input");

                    htmlNode.type = control.type;
                    htmlNode.value = control.name;
                    htmlNode.id = control.name + "Control";

                    div.appendChild(label);
                    div.appendChild(htmlNode);
                    form.appendChild(div);

                    this[control.name + "Control"] = htmlNode;
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
                case "range":  {
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

                    let number = document.createElement("input");
                    number.id = name + "Display";
                    number.type="number";
                    number.value = control.htmlAttributes.value;

                    number.min = control.htmlAttributes.min;

                    number.max = control.htmlAttributes.max;
                    number.step = control.htmlAttributes.step;

                    number.oninput = () => {
                        input.value = number.value;
                    }

                    input.oninput = () => {
                        number.value = input.value;
                    }

                    div.appendChild(label);
                    div.appendChild(input);
                    div.appendChild(number);
                    form.appendChild(div);

                    this[name+"Control"] = input;
                    this[name+"Display"] = number;
                }
            }
        }

        parentHtmlNode.appendChild(form);
        this.form = form;

        return this;
    }
}

Object.defineProperty(ControlPanel.prototype, 'values', {
    get() {
        const controls = Object.entries(this).filter(n=>this.hasOwnProperty(n[0]) && n[0].endsWith("Display"));
        const values = {};
        for (const c of controls) {
            if (this[c[0]].type === "checkbox") {
                values[c[0].replace("Display", "")] = c[1].checked;
            } else if (this[c[0]].localName === "span") {
                values[c[0].replace("Display", "")] = c[1].innerText;
            } else {
                values[c[0].replace("Display", "")] = parseFloat(c[1].value);
            }
        }
        return values;
    },

    set(values) {
        const entries = Object.entries(values);

        for (const [name, value] of entries) {
            if (this[name+"Control"]) {
                this[name+"Control"].value = value;
            }

            if (this[name+"Display"]) {
                if (this[name+"Display"].localName === "span") {
                    this[name+"Display"].innerText = value;
                } else {
                    this[name+"Display"].value = value;
                }
            }
        }
    }
});

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

