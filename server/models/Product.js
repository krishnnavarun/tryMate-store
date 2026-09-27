import mongoose from 'mongoose';
import { slugify } from '../utils/strings.js';

export const CATEGORIES = ['upper_body', 'lower_body', 'dresses'];
export const PRODUCT_TYPES = ['shirt', 'tshirt', 'polo'];
export const GENDERS = ['men', 'women', 'unisex'];
export const SIZE_FIELDS = ['chest', 'waist', 'length', 'shoulder', 'sleeve'];

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const HTTP_URL = /^https?:\/\/\S+$/i;

// One measurement range in cm: [min, max]. Optional: a size may leave a field out.
const cmRange = {
  type: [Number],
  default: undefined, // otherwise Mongoose stores an empty [] for every missing field
  validate: {
    validator: (value) => value == null || (value.length === 2 && value[0] >= 0 && value[0] <= value[1]),
    message: 'must be [min, max] in cm, with min <= max',
  },
};

// Body-measurement ranges (cm) that one size is meant to fit, e.g.
// { chest: [92, 98], waist: [80, 86], length: [70, 72], shoulder: [43, 45], sleeve: [62.5, 64] }
// (length and sleeve are garment lengths; sleeve only for long sleeves)
// This is exactly the per-size shape the AI service's /recommend-size expects.
const sizeRangesSchema = new mongoose.Schema(
  Object.fromEntries(SIZE_FIELDS.map((field) => [field, cmRange])),
  { _id: false },
);

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, match: [HEX_COLOR, 'must be a hex color like #1F2A44'] },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 4000 },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      min: 0,
      validate: {
        // `this` is the document being validated
        validator(value) {
          return value == null || value < this.price;
        },
        message: 'discountPrice must be lower than price',
      },
    },

    category: { type: String, required: true, enum: CATEGORIES },
    type: { type: String, required: true, enum: PRODUCT_TYPES },
    gender: { type: String, required: true, enum: GENDERS },

    colors: {
      type: [colorSchema],
      validate: { validator: (v) => v.length > 0, message: 'at least one color is required' },
    },
    // Display images (one per color, in the same order as `colors`, when possible)
    images: {
      type: [{ type: String, match: [HTTP_URL, 'must be an http(s) URL'] }],
      validate: { validator: (v) => v.length > 0, message: 'at least one image is required' },
    },
    // Clean flat-lay photo on a plain background, sent to the AI try-on
    garmentImageUrl: { type: String, required: true, match: [HTTP_URL, 'must be an http(s) URL'] },
    // Optional transparent PNG of the garment (front view, sleeves included) for the live
    // fitting room. Without it, the fitting room draws the garment shape in its colour.
    overlayImageUrl: { type: String, match: [HTTP_URL, 'must be an http(s) URL'] },

    // { S: {...ranges}, M: {...}, ... }. A Map keeps the sizes in the order they were added.
    sizeChart: {
      type: Map,
      of: sizeRangesSchema,
      validate: { validator: (v) => v && v.size > 0, message: 'at least one size is required' },
    },
    // { S: 10, M: 5, ... }
    stock: { type: Map, of: { type: Number, min: 0 }, default: {} },
  },
  {
    timestamps: true,
    toJSON: { flattenMaps: true, versionKey: false },
    toObject: { flattenMaps: true, versionKey: false },
  },
);

// Build the slug from the name if it wasn't given.
// (Mongoose 9: middleware is a plain/async function; there is no `next` callback.)
productSchema.pre('validate', function setSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

// Indexes for the shop filters
productSchema.index({ category: 1, type: 1 });
productSchema.index({ 'colors.name': 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
