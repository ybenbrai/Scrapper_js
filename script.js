const axios = require("axios");
const fs = require("fs");
const readline = require("readline");

let freshProduct = {
  reference: null, // endpoint id
  Category_ID: null, // category name
  Sub_Category_ID: null, // subcategory name
  name: {
    ar: null,
    en: null,
    fr: null,
  }, // {"ar" :"", "en":"",fr:""}
  short_description: {
    ar: null,
    en: null,
    fr: null,
  }, // {"ar" :"", "en":"",fr:""},
  description: {
    ar: null,
    en: null,
    fr: null,
  }, // {"ar" :"", "en":"",fr:""},
  images: null, //  uploads/images/products/${productID}.jpg
  code: null, // endpoint id
  mesures: [
    {
      key: "material",
      value: "",
    },
    {
      key: "weight",
      value: "",
    },
  ], // [{\"key\":\"material\",\"value\":\"100% polyester\"},{\"key\":\"weight\",\"value\":\"280 g\"}]
  long_images: null, //  uploads/images/products/${productID}-.jpg
  price: '{"MAD":10,"eur":10,"usd":10}',
  stock: 0,
  points: 12,
  display: 1,
  note: 12,
  colors: "[]",
  shippings: "[]",
};

const instance = axios.create({
  withCredentials: true,
  baseURL: "http://ximi-v.com",
});

const Login = async () => {
  try {
    let res = await instance.post("/w1/user/login", {
      username: "zouhir",
      password: "123456",
    });
    SaveCookies = res.headers["set-cookie"]?.reduce(
      (prev, val) => `${prev} ; ${val}`
    );
    return res;
  } catch (e) {
    console.log(e);
  }
  return false;
};

const sleep = (waitTimeInMs) =>
  new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

const googleTranslateStr = async (Str, destLang) => {
  const encodedParams = new URLSearchParams();
  encodedParams.append("q", Str);
  encodedParams.append("target", destLang);
  encodedParams.append("source", "en");

  const options = {
    method: "POST",
    url: "https://google-translate1.p.rapidapi.com/language/translate/v2",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "application/gzip",
      "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
      "X-RapidAPI-Key": "cd74eecd5emshf08c5653df5400ep1831f1jsna4682a33f7cf",
      // 'X-RapidAPI-Key': '397b60d6damshd9b839b082bad06p1684bejsnf37efd42c785'
    },
    data: encodedParams,
  };

  let response = await axios.request(options);
  if (response.status === 200) {
    return response.data.data.translations[0].translatedText;
  }
  return "traduction error";
};
let a = 6;
let product = 1;
// const TranslateStr = async (
//     Str,
//     destLang
// ) => {
//     const options = {
//         method: 'GET',
//         url: 'https://api.mymemory.translated.net/get',
//         params: {langpair: `en|${destLang}`, q: Str.toLowerCase(), mt: '1', onlyprivate: '0', de: 'a@b.c'},
//         headers: {
//             'X-Referer' : 'https://api.mymemory.translated.net'
//         }
//     };

//     let res = await axios.request(options);
//     if (res.status === 200){
//  let remainder = a % 6;
//  if (remainder === 0) {
//    console.log("success : ", product);
//    product++;
//  }
//  a++;
//       return res.data?.responseData?.translatedText || 'traduction error';
//     }
//     return 'traduction error';
// }
const TranslateStr = async (Str, destLang) => {
  const options = {
    method: "GET",
    url: "https://translated-mymemory---translation-memory.p.rapidapi.com/api/get",
    params: {
      langpair: `en|${destLang}`,
      q: Str.toLowerCase(),
      mt: "1",
      onlyprivate: "0",
      de: "a@b.c",
    },
    headers: {
      "X-RapidAPI-Host":
        "translated-mymemory---translation-memory.p.rapidapi.com",
      "X-RapidAPI-Key": "b4f5c9145amsh5f901e645411355p16689fjsndf0d4448824d",
    },
  };

  let res = await axios.request(options);
  if (res.status === 200) {
    let remainder = a % 6;
    if (remainder === 0) {
      console.log("success : ", product);
      product++;
    }
    a++;

    return res.data?.responseData?.translatedText || "traduction error";
  }
  return "traduction error";
};

let start = async () => {
  try {
    let res = await Login();
    if (res.status === 200) {
      const productsFileStream = fs.createWriteStream("./products.json");
      let authorization = res.data.data.token;
      let resCategories = await instance.get("/w1/goods/goodsType/all", {
        headers: {
          authorization,
        },
      });

      productsFileStream.write("[");

      let allCatg = resCategories.status === 200 ? resCategories.data.data : [];
      var lineReader = readline.createInterface({
        input: require("fs").createReadStream("./links.txt"),
        crlfDelay: Infinity,
      });
      let flag = 0;
      for await (const cline of lineReader) {
        const line = cline.trim();
        if (line !== "") {
          if (flag) productsFileStream.write(",");
          flag = 1;
          let obj = freshProduct;
          let reference = line.match(/[\d]+$/)[0];
          // console.log('=> ', reference);
          let res = await instance.get(`/w1/goods/info/${reference}`, {
            headers: {
              authorization,
            },
          });
          if (res.status === 200) {
            obj.name.en = res.data.data.item_en;
            obj.name.ar = await TranslateStr(res.data.data.item_en, "ar");
            obj.name.fr = await TranslateStr(res.data.data.item_en, "fr");
            obj.Category_ID = allCatg.reduce(
              (prev, val) =>
                val.cls_no === res.data.data.b_type ? val.cls_name : prev,
              "unknown"
            );
            obj.Sub_Category_ID = allCatg.reduce(
              (prev, val) =>
                val.cls_no === res.data.data.m_type ? val.cls_name : prev,
              "unknown"
            );
          }
          res = await instance.get(`/w1/goods/goodsExtend/${reference}`, {
            headers: {
              authorization,
            },
          });
          if (res.status === 200) {
            obj.mesures[0].value = `${res.data.data?.material_en || ""}`;
            obj.mesures[1].value = `${res.data.data?.weight || "300"} g`;
            let arDesc = await TranslateStr(
              `${res.data.data.features_en} ${res.data.data.usage_en} ${res.data.data["notes_en"]} ${res.data.data["caution_en"]}`,
              "ar"
            );
            let frDesc = await TranslateStr(
              `${res.data.data.features_en} ${res.data.data.usage_en} ${res.data.data["notes_en"]} ${res.data.data["caution_en"]}`,
              "fr"
            );
            obj.description = {
              en: `${res.data.data.features_en} ${res.data.data.usage_en} ${res.data.data["notes_en"]} ${res.data.data["caution_en"]}`,
              ar: arDesc,
              fr: frDesc,
            };
            obj.short_description = {
              en: `${res.data.data.features_en}`,
              ar: `${await TranslateStr(res.data.data.features_en, "ar")}`,
              fr: `${await TranslateStr(res.data.data.features_en, "fr")}`,
            };
          }
          obj = {
            ...obj,
            reference: String(reference),
            code: String(reference),
            images: `uploads/images/products/${reference}.jpg`,
            long_images: `uploads/images/products/${reference}-.jpg`,
          };
          productsFileStream.write(JSON.stringify(obj) + "\n");
        }
        // sleep(125);
      }
      productsFileStream.write("]");
    } else console.error("auth fail");
  } catch (e) {
    console.error("something went wrong !!", e);
  }
  process.exit(0);
};

start();

/*

    all categoreis : http://ximi-v.com/w1/goods/goodsType/all

    (val) => val.cls_no === 250705 // gt_cls_no
    val.cls_no === 2507 // m_type subcategory
    val.cls_no === 25 // b_type category

    images : https://hwimg.xmvogue.com/thumb/${productID}.jpg?x-oss-process=style/440
    uploads/images/products/${productID}.jpg
    
    detail image :  http://hwimg.xmvogue.com/detail/${productID}-.jpg?x-oss-process=style/800
    uploads/images/products/${productID}-.jpg

    
    GET /w1/goods/info/{id} =>
    {
        error: 0,
        message: 'success',
        data: {
            item_en: 'Halloween DIY Pumpkin Hanging Decoration Set (Yellow)',
        }
    }

    GET  /w1/goods/goodsExtend/${id} =>
    {
        {"error":0,"message":"success",
        "data":{
            "material_en":"paper, PVC",
            "weight":"17",
            short_descr : features_en ,

            Features:Skin-friendly and comfortable. Durable and absorbent. Ensures easy washing and quick drying. Not easy to pill or discolor.

            Usage:Do not bleach and iron the product.
            
            Notes:Wash with neutral detergent and normal-temperature water. Wash dark-colored clothes and light-colored clothes separately. Avoid overexposure to the sun.
            
desc {   short {
            "features_en":"Trendy and funny cartoon decoration to bring more fun to festival. Helps cultivate unique Halloween festival atmosphere.",
        
            "usage_en":"Can be strung up, or fixed with adhesive tape and clips. Suitable for hanging on ceilings, walls, windows, trees, baskets, gifts and so on.",
        }
            "notes_en":"For indoors decoration only. Not a toy.",
            "caution_en":"Contains small parts. Not suitable for children under 3 years of age."
        }
    }
    }
*/
