require("../src/js.js");
const Path = require("./Path");
const FileSystem = require('fs');
const Mime = require("mime-types");
const getDimensions = require('image-size');
const Vibrant = require("node-vibrant");
const nodeThumbnail = require('image-thumbnail');


let PRODUCTS_FOLDER = Path.project.resolve("./res/image/product/");
let picturesFolder = PRODUCTS_FOLDER.childrenMap.galleries;

let thumbnailsFolder = PRODUCTS_FOLDER.childrenMap.thumbnails;
if (thumbnailsFolder)
	thumbnailsFolder.clear();
else
	thumbnailsFolder = PRODUCTS_FOLDER.newDirectory("thumbnails");



let products = picturesFolder.children.filter(item => item.isDirectory && item.children.length && !item.hidden)
	.map(folder => ({
		id : folder.name,
		gallery : folder.children
			.filter(item =>
				item.isFile
				&& !item.hidden
				&& Mime.lookup(item.toString())
					.startsWith("image")
			).map(path => ({path, file : path.fullName})),
	}));

// ----
(async () => {
	await products.forEachAsync(async product => {

		// get data
		await product.gallery.forEachAsync(async image => {
			let {path} = image;

			// dimensions
			Object.assign(image, getDimensions(path.toString()));

			// colors
			let palette = await Vibrant.from(path.toString()).getPalette();
			image.colors = [
				(palette.LightVibrant || palette.LightMuted || palette.Vibrant || palette.Muted).getHex(),
				(palette.DarkVibrant || palette.DarkMuted || palette.Vibrant || palette.Muted).getHex(),
			];

			onFileDone();
		});


		// thumbnail first image in gallery
		await buildThumbnail(product)
	});

	// finished
	products.forEach(({thumbnail, gallery}) => {
		gallery.forEach(image => {delete image.path});
	});

	FileSystem.writeFileSync("src/products.js", `export default ${JSON.stringify(products)}`);
})();


let totalNumberOfImages =  products.flatMap(({gallery}) => gallery).length;
let done = 0; // to display percentage
function onFileDone(){
	done++;
	console.clear();
	console.log(Math.trunc(done * 100 / totalNumberOfImages) + '%');
}


const thumbnailMaxSize = 300;
async function buildThumbnail(product){
	let [firstImage] = product.gallery;

	let thumbnail = product.thumbnail = Object.assign(
		{},
		firstImage,
		{file: `${product.id}.${firstImage.path.extension}`}
	);
	delete thumbnail.path;

	let [lower, higher] = ["width", "height"]
		.sort((dim1, dim2) => firstImage[dim1] - firstImage[dim2]);

	if (firstImage[higher] < thumbnailMaxSize)
		// just copy the image
		firstImage.path.copyTo(thumbnailsFolder + thumbnail.file);

	else {
		let dimensions = {[higher]: thumbnailMaxSize};
		dimensions[lower] = Math.round(firstImage[lower] * thumbnailMaxSize / firstImage[higher]);

		let data = await nodeThumbnail(firstImage.path.toString(), dimensions);
		thumbnailsFolder.newFile(product.thumbnail.file, data);
		Object.assign(thumbnail, dimensions);
	}
}
