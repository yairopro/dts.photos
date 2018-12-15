const FileSystem = require('fs');
const Mime = require("mime-types");
const getDimensions = require('image-size');
const Vibrant = require("node-vibrant");

let PRODUCTS_PATH = "./res/image/product/";

let done = 0;
let numberOfFiles = FileSystem.readdirSync(PRODUCTS_PATH)
	.map(Number)
	.filter(id => !isNaN(id))
	.map(id => FileSystem.readdirSync(PRODUCTS_PATH + id))
	.reduce((result, item) => result.concat(item), [])
	.length;

// for each dir create a gallery array
Promise.all(
	FileSystem.readdirSync(PRODUCTS_PATH)
	// convert
		.map(Number)
		// filter
		.filter(id => !isNaN(id))
		// sort
		.sort((a, b) => a - b)
		// build gallery
		.map(id =>
			Promise.all(
			FileSystem.readdirSync(PRODUCTS_PATH + id)
				.map(fileName => ({
					fileName,
					index : Number(fileName.slice(0, fileName.lastIndexOf("."))),
					contentType : Mime.lookup(PRODUCTS_PATH + id + "/" + fileName),
				}))
				.filter(({index, contentType}) => !isNaN(index) && contentType && contentType.startsWith("image"))
				.sort((a, b) => a.index - b.index)
				.map(async ({fileName, type}) => ({
					type,
					...getDimensions(PRODUCTS_PATH + id + "/" + fileName),
					colors : await Vibrant.from(PRODUCTS_PATH + id + "/" + fileName)
						.getPalette()
						.then(palette => {
						console.log(`${Math.trunc(++done * 100 / numberOfFiles)}%`);

						return [
							(palette.LightVibrant || palette.LightMuted || palette.Vibrant || palette.Muted).getHex(),
							(palette.DarkVibrant || palette.DarkMuted || palette.Vibrant || palette.Muted).getHex(),
						];
					})
				}))
			)
		)
).then(products => {
	FileSystem.writeFileSync("src/products.js", 'export default ' + JSON.stringify(products));
}).catch(console.error);
// place the array in the products.js file
