// The price the customer actually pays: the discount price when there is one.
export function effectivePrice(product) {
  return product.discountPrice ?? product.price;
}

// The display image for a color: images are stored one per color, in the same order.
export function imageForColor(product, colorName) {
  const index = product.colors.findIndex((c) => c.name === colorName);
  return product.images[index] ?? product.images[0];
}
