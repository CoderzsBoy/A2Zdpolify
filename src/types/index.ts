
import type { Timestamp } from 'firebase/firestore';

export type ProductType = 'physical' | 'customized' | 'digital';

export interface ProductImage {
  url: string;
  altText?: string;
  color?: string; // e.g., "Black", "Red" - should match a value in availableColors
  isPrimary?: boolean;
}

export interface BaseProduct {
  id: string; // This will be the Firestore document ID
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: string;
  subCategory?: string;
  keywords?: string[];
  dataAiHint?: string;
  productType: ProductType;
}

export interface PhysicalProductSpecifics {
  availableColors?: string[];
  availableSizes?: string[];
}

export interface CustomizedProductSpecifics extends PhysicalProductSpecifics { // Customized can also have colors/sizes
  allowImageUpload?: boolean;
  customizationInstructions?: string;
  allowTextCustomization?: boolean;
  textCustomizationLabel?: string;
  textCustomizationMaxLength?: number;
  defaultImageX?: number;
  defaultImageY?: number;
  defaultImageScale?: number;
  defaultTextX?: number;
  defaultTextY?: number;
  defaultTextSize?: number;
}

export interface DigitalProductSpecifics {
  fileFormat?: string;
  downloadUrl?: string;
}

// This union type ensures that if productType is 'physical', only PhysicalProductSpecifics are applicable, etc.
export type Product = BaseProduct & (
  | ({ productType: 'physical' } & PhysicalProductSpecifics)
  | ({ productType: 'customized' } & CustomizedProductSpecifics) // Now includes PhysicalProductSpecifics implicitly
  | ({ productType: 'digital' } & DigitalProductSpecifics)
);


export interface CartItemCustomization {
  customImageDataUri?: string;
  imageX?: number;
  imageY?: number;
  imageScale?: number;
  text?: string;
  textX?: number;
  textY?: number;
  textSize?: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface CartItem {
  // Inherits all fields from Product
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // Specific image for the cart item (primary or color-selected)
  images: ProductImage[]; // Original full list of product images
  category: string;
  subCategory?: string;
  keywords?: string[];
  dataAiHint?: string;
  productType: ProductType;

  // Specifics depending on productType (for type safety on CartItem if needed)
  availableColors?: string[];
  availableSizes?: string[];
  allowImageUpload?: boolean;
  // Digital product specifics
  fileFormat?: string;
  downloadUrl?: string;
  // Customized product specifics
  customizationInstructions?: string;
  allowTextCustomization?: boolean;
  textCustomizationLabel?: string;
  textCustomizationMaxLength?: number;


  // Cart-specific fields
  cartItemId: string;
  quantity: number;
  customization?: CartItemCustomization | null;
}

export interface CartItemFirestore {
  productId: string;
  quantity: number;
  customization?: CartItemCustomization | null;
  addedAt: Timestamp;
  imageForCart: string;
}

export interface WishlistItem extends Product {
  wishlistItemId: string;
}

export interface WishlistItemFirestore {
  productId: string;
  addedAt: Timestamp;
}

export interface BrowsingHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  viewedAt: Timestamp;
}

export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  hasClaimedFiveProductGift?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number; // Percentage
  isActive: boolean;
  maxUses?: number | null;
  timesUsed?: number;
  minAmount: number;
  validTill: Timestamp | Date;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  addressLine?: string;
  state?: string;
  zipCode?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customization?: CartItemCustomization | null;
  productType: ProductType;
  downloadUrl?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Approved'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested' // This status can be on the Order if the whole order is marked for return
  | 'Returned' // This status can be on the Order if the whole order is returned
  | 'Paid'
  | 'Payment Failed'
  | 'Pending Payment'
  | 'Completed';

export type PaymentMethod = 'Cash on Delivery' | 'Online Payment';

export interface Order {
  id: string;
  userId?: string | null;
  customerInfo: CheckoutFormData;
  items: OrderItem[];
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  appliedCoupon?: {
    id: string;
    code: string;
    discount: number;
  } | null;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Timestamp;
}

export interface ReturnRequestData {
  upiId: string;
  reason: string;
}

// Updated ReturnRequestStatus to include more granular states
export type ReturnRequestStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'Processing' // e.g., item received, refund being processed
  | 'Completed' // e.g., refund issued
  | 'Cancelled'; // If user cancels the return request or admin cancels it

export interface ReturnRequest {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantityReturned: number;
  userId: string; // The UID of the user who requested the return
  userEmail?: string; // Email of the user, denormalized for easier display in admin
  upiId: string;
  reason: string;
  requestedAt: Timestamp;
  status: ReturnRequestStatus;
  orderCreatedAt: Timestamp; // Useful for checking eligibility or context
}

// For Product Request Feature
export interface ProductRequestFormData {
  productName: string;
  description: string;
  category?: string;
  estimatedPrice?: string;
  referenceLink?: string;
  userEmail: string;
}

export type ProductRequestStatus = 'Pending Review' | 'Under Consideration' | 'Approved' | 'Not Feasible' | 'Sourced';

export interface ProductRequest extends ProductRequestFormData {
  id: string; // Firestore document ID
  userId?: string | null; // From currentUser.uid if logged in
  requestedAt: Timestamp;
  status: ProductRequestStatus;
}

// For Feedback Feature
export interface FeedbackFormData {
  message: string;
}

export interface FeedbackEntry {
  id: string; // Firestore document ID
  userId: string; // From currentUser.uid
  userEmail: string; // From currentUser.email
  displayName: string | null; // From currentUser.displayName
  message: string;
  submittedAt: Timestamp;
}

// For Surprise Gift Feature
export interface GiftClaimFormData {
  name: string;
  phone: string;
  addressLine: string;
  state: string;
  zipCode: string;
}

export interface GiftClaim {
  id: string; // Firestore document ID
  userId: string;
  userEmail: string; // For easier reference
  claimedAt: Timestamp;
  shippingDetails: GiftClaimFormData;
  giftType: string; // e.g., "5ProductMilestone"
}
