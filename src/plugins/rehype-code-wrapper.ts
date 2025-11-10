import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { h } from "hastscript";

export default function rehypeCodeWrapper() {
  return function (tree: Root) {
    visit(tree, "element", function (node, index, parent) {
      // Only process <pre> elements.
      if (node.tagName != "pre") {
        return;
      }

      const filename = node.properties.dataFilename as string;

      // Wrap the <pre> element with a new div.
      const wrappedNode = h("div.code-container", [
        h("div.code-header", [
          h("div.code-filename", [filename]),
          h("button.code-copy", ["Copy"]),
        ]),
        node, // the original <pre> element
      ]);

      // Replace the original node.
      if (parent && index != null) {
        parent.children[index] = wrappedNode;
      }
    });
  };
}
