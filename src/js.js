if (!Array.prototype.flatMap)
	Object.defineProperties(Array.prototype, {
		flatMap : {
			enumerable: false,
			value : function(mapper){
				return this.reduce((result, item) => result.concat(mapper(item)), []);
			}
		}
	});

Array.prototype.forEachAsync = async function (asyncOnEach) {
	for (let i = 0; i < this.length; i++)
		await asyncOnEach(this[i], i);
};
