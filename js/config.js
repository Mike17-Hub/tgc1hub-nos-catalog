/* =====================================================================
   TGC1HUB NOS — SITE CONFIGURATION
   Edit everything in this file. app.js reads from here and should not
   need to change for normal customization (colors are in css/styles.css).
   ===================================================================== */

const CONFIG = {

  // ---- Supabase ----
  supabase: {
    url: 'https://tnafmvkywordzwxoiomt.supabase.co',
    publishableKey: 'sb_publishable_FMXPJoaPFNAMWa2evxsrgg_ioFrBicM',
    table: 'product_vw',      // use Supabase view for enriched product details
    orderBy: 'ItemCode.asc'   // use the actual view column name
  },

  // ---- Cloudflare R2 (product images) ----
  r2BaseUrl: 'https://pub-431a1eccf270455a99eab6163255ef53.r2.dev',
  r2DefaultImageFile: 'IMG_0001.png',

  // ---- Business info ----
  business: {
    name: 'TGC1HUB NOS',
    tagline: 'Tan Group of Companies • QC • EST 2026',
    address: '#28 Champaca Arty 1 Talipapa, Novaliches, Quezon City',
    addressShort: '#28 Champaca Arty 1 Talipapa QC',
    hours: 'BODEGA HOURS: 8:30AM-6PM',
    phoneDisplay: '0917-104-2181',
    phoneDial: '+639171042181'
  },

  // ---- Contact channels ----
  contact: {
    messengerUrl: 'https://www.messenger.com/login.php?next=https%3A%2F%2Fwww.messenger.com%2Ft%2F974765152396661%2F%3Fmessaging_source%3Dsource%253Apages%253Amessage_shortlink%26source_id%3D1441792%26recurring_notification%3D0',
    messengerHandleLabel: 'm.me/TGC1HubNOS',
    fbPageUrl: 'https://www.facebook.com/TGC1HubNOS',
    whatsappNumber: '09171042181',   // local PH format, auto-converted below
    viberNumber: '09051876590'
  },

  // ---- Hero "proof of legit" showcase ----
  // This can be a fixed example, or set useLatestSoldOut: true to
  // automatically pull the most recent sold-out item from your table.
  proof: {
    useLatestSoldOut: true,
    fallbackPartNumber: 'DB1378',
    fallbackName: 'Toyota Echo 2002',
    fallbackChassis: 'NCP13 / AE92 / NCP42',
    receiptNumber: 'OR-2026-1378',
    riderName: 'Kuya Roger',
    partsSold: '1000+',
    fbRating: '5.0',
    tag1: 'Rider + Resibo + 5 Star',
    tag2: 'NOS • Never Installed',
    description: "Over 1,000+ Genuine NOS & Pull-Out Auto Parts • Sourced from Nationwide Company Store Clearance • New Old Stock - When It's Gone, It's Gone Forever" 
  },

  // ---- "Why us" section ----
  why: {
    eyebrow: 'WHY TGC1HUB NOS',
    note: 'Lahat ng parts may proof — video, resibo, rider. Pag duda ka, video call tayo sa bodega mismo.',
    cards: [
      { icon: 'video', badge: 'LIVE', title: 'Video Call sa Bodega', desc: 'Live video sa warehouse para makita mo actual stock. Walang tinatago.' },
      { icon: 'receipt', badge: null, title: 'Official Receipt', desc: 'May resibo per transaction. Proof na legit ang bawat benta.' },
      { icon: 'truck', badge: 'SAME-DAY', title: 'Lalamove / J&T / LBC', desc: 'Same-day via Lalamove sa QC. Provincial via J&T / LBC.' },
      { icon: 'star', badge: null, title: '5-Star Rating', desc: 'Pure 5-star feedbacks. Check FB page reviews, puro satisfied customers.' }
    ]
  },

  // ---- How to order steps (footer) ----
  orderSteps: [
    'PM chassis number mo (ex: NCP13, AE92)',
    'Video call sa bodega para sure',
    'Lalamove / LBC + resibo'
  ],
  footerNote: 'NOTE: We only sell NOS (New Old Stock) from our stores inventory clearance. Once sold out, no restock.',

  bodegaStatus: 'BODEGA OPEN',
  wazeLabel: 'Waze: TGC1Hub NOS',

  // If your columns use different names than the defaults below, add
  // them to the matching array — the first one found in each row wins.
  fieldAliases: {
    partNumber: ['ItemCode', 'item_code', 'part_num', 'PartNum', 'partnum', 'Part Number', 'part_number', 'sku', 'code', 'chassis_code', 'model_code'],
    name: ['Description', 'description', 'PartName', 'part_name', 'Part Name', 'part name', 'name', 'title', 'product_name'],
    partName: ['Description', 'description', 'PartName', 'part_name', 'Part Name', 'part name', 'PartNum', 'partnum', 'name', 'title', 'product_name'],
    fullDescription: ['FullDescription', 'full_description', 'fulldescription', 'details'],
    category: ['Category', 'category', 'type', 'part_type'],
    subCategory: ['Sub-Category', 'Sub Category', 'sub_category', 'sub category', 'sub_categories', 'sub categories', 'SubCategory', 'subCategory', 'subcategory', 'subcategories'],
    descriptionCategory: ['Description', 'description', 'DescriptionCategory', 'description_category', 'Description Category', 'description category', 'category_description'],
    compatibility: ['Model', 'model', 'YearModel', 'year_model', 'compatibility', 'compatible_models', 'fitment_codes', 'chassis', 'tags'],
    fitment: ['Spec', 'spec', 'TypePosition', 'type_position', 'fitment', 'fitment_description', 'notes', 'description'],
    status: ['Status', 'status', 'availability', 'stock', 'in_stock'],
    qty: ['Qty', 'qty', 'qty_on_hand', 'QtyOnHand', 'QuantityOnHand', 'quantity', 'quantity_on_hand', 'stock_qty', 'stockqty'],

    image: ['image_path', 'image_url', 'image', 'photo', 'photo_url'],
    itemCode: ['ItemCode', 'item_code', 'itemcode', 'sku', 'code', 'part_number'],
    brand: ['Brand', 'brand', 'maker', 'manufacturer'],
    srp: ['SRP', 'srp', 'price', 'suggested_price', 'msrp'],
    condition: ['Condition', 'condition', 'Remarks', 'remarks', 'note', 'notes'],
    location: ['location', 'location_tag', 'branch', 'bodega']
  }
};
