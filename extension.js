(function (Scratch) {
    'use strict';

    /*
     * Make Slider Max a Variable
     *
     * Gandi 3.0 / Scratch-compatible extension.
     *
     * This extension discovers HTML range inputs currently used as sliders
     * in the Gandi editor. The block's dropdown is rebuilt every time it
     * opens, so newly-created sliders appear automatically.
     */

    const sliderRegistry = new Map();
    let nextSliderId = 1;
    let observer = null;

    function isSliderInput(node) {
        return node instanceof HTMLInputElement && node.type === 'range';
    }

    function getSliderLabel(slider, index) {
        const aria = slider.getAttribute('aria-label');
        if (aria) return aria.trim();

        const title = slider.getAttribute('title');
        if (title) return title.trim();

        const id = slider.id;
        if (id) {
            const label = document.querySelector('label[for="' + CSS.escape(id) + '"]');
            if (label && label.textContent.trim()) return label.textContent.trim();
        }

        const parent = slider.closest('[data-slider-label], [aria-label], [title]');
        if (parent) {
            const label =
                parent.getAttribute('data-slider-label') ||
                parent.getAttribute('aria-label') ||
                parent.getAttribute('title');
            if (label && label.trim()) return label.trim();
        }

        // Try nearby visible text without using the entire workspace/block text.
        let el = slider.parentElement;
        for (let depth = 0; el && depth < 3; depth++, el = el.parentElement) {
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (text && text.length <= 80) return text;
        }

        return 'Slider ' + index;
    }

    function scanSliders() {
        const found = [];
        const inputs = Array.from(document.querySelectorAll('input[type="range"]'));

        inputs.forEach((slider, index) => {
            let id = slider.dataset.makeSliderMaxId;
            if (!id) {
                id = 'slider-' + nextSliderId++;
                slider.dataset.makeSliderMaxId = id;
            }

            const label = getSliderLabel(slider, index + 1);
            const existing = sliderRegistry.get(id);

            sliderRegistry.set(id, {
                id,
                element: slider,
                label: label || ('Slider ' + (index + 1)),
                max: Number(slider.max)
            });

            found.push({
                id,
                label: label || ('Slider ' + (index + 1))
            });
        });

        // Remove elements that no longer exist.
        for (const [id, entry] of sliderRegistry) {
            if (!entry.element.isConnected) sliderRegistry.delete(id);
        }

        return found;
    }

    function getSliderMenuItems() {
        const sliders = scanSliders();

        if (!sliders.length) {
            return [{text: 'No sliders found', value: '__none__'}];
        }

        return sliders.map((slider, index) => ({
            text: slider.label || ('Slider ' + (index + 1)),
            value: slider.id
        }));
    }

    function setNativeValue(slider, value) {
        const numericMax = Number(value);
        if (!Number.isFinite(numericMax)) return false;

        // HTML range inputs require max >= min. Preserve the slider's min.
        const min = Number(slider.min);
        const safeMax = Number.isFinite(min)
            ? Math.max(min, numericMax)
            : numericMax;

        slider.max = String(safeMax);

        // Keep the current value inside the new range.
        const current = Number(slider.value);
        if (Number.isFinite(current) && current > safeMax) {
            slider.value = String(safeMax);
        }

        // Tell Gandi/React/etc. that the field changed.
        slider.dispatchEvent(new Event('input', {bubbles: true}));
        slider.dispatchEvent(new Event('change', {bubbles: true}));

        return true;
    }

    class MakeSliderMaxAVariable {
        constructor(runtime) {
            this.runtime = runtime;

            // The dropdown is evaluated when opened. A MutationObserver makes
            // discovery react quickly after blocks/sliders are added.
            if (typeof window !== 'undefined' && !observer) {
                observer = new MutationObserver(() => scanSliders());
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        }

        getInfo() {
            return {
                id: 'makeslidermaxavariable',
                name: 'Make Slider Max a Variable',
                color1: '#4C97FF',
                color2: '#3373CC',
                color3: '#2E5AA8',
                blocks: [
                    {
                        opcode: 'setSliderMax',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Make the maximum value of slider [SLIDER] [MAX]',
                        arguments: {
                            SLIDER: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sliders'
                            },
                            MAX: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 100
                            }
                        }
                    }
                ],
                menus: {
                    sliders: {
                        acceptReporters: false,
                        items: 'getSliderMenuItems'
                    }
                }
            };
        }

        getSliderMenuItems() {
            return getSliderMenuItems();
        }

        setSliderMax(args) {
            const id = String(args.SLIDER || '');
            if (!id || id === '__none__') return;

            scanSliders();

            const entry = sliderRegistry.get(id);
            if (!entry || !entry.element || !entry.element.isConnected) {
                return;
            }

            setNativeValue(entry.element, args.MAX);
            entry.max = Number(entry.element.max);
        }
    }

    Scratch.extensions.register(new MakeSliderMaxAVariable());
})(Scratch);
