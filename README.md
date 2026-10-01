# Make Slider Max a Variable

A Gandi 3.0 extension that adds:

> **Make the maximum value of slider [dropdown of every slider] [number]**

The slider dropdown is rebuilt when it opens, so sliders that appear later in the editor can be discovered automatically.

## Install

Use the raw `extension.js` file as a custom/remote extension in Gandi.

The extension looks for HTML `input[type="range"]` controls in the current Gandi editor.

## Behavior

- Finds every currently-rendered range slider.
- Gives each slider a dropdown entry.
- Changes that slider's HTML `max` value.
- If the current value is above the new maximum, it is clamped to the new maximum.
- Sends `input` and `change` events so the host UI can react.

## Important limitation

This implementation works with sliders rendered as HTML range inputs. If a Gandi slider is rendered as SVG/canvas or is implemented entirely as a custom non-range field, it needs a Gandi-specific adapter for that field implementation.
