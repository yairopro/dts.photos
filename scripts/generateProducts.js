const FileSystem = require('fs');
const Mime = require("mime-types");
const getDimensions = require('image-size');

let PRODUCTS_PATH = "./res/image/product/";

// for each dir create a gallery array
let productsGallery = FileSystem.readdirSync(PRODUCTS_PATH)
	// convert
	.map(Number)
	// filter
	.filter(id => !isNaN(id))
	// sort
	.sort((a, b) => a - b)
	// build gallery
	.map(id =>
		FileSystem.readdirSync(PRODUCTS_PATH + id)
			.map(fileName => ({
				fileName,
				index : Number(fileName.slice(0, fileName.lastIndexOf("."))),
				contentType : Mime.lookup(PRODUCTS_PATH + id + "/" + fileName),
			}))
			.filter(({index, contentType}) => !isNaN(index) && contentType && contentType.startsWith("image"))
			.sort((a, b) => a.index - b.index)
			.map(({fileName, type}) => ({
				type,
				...getDimensions(PRODUCTS_PATH + id + "/" + fileName),
			}))
	);

// place the array in the products.js file
