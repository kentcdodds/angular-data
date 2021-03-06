var errorPrefix = 'DS.update(resourceName, id, attrs[, options]): ';

/**
 * @doc method
 * @id DS.async_methods:update
 * @name update
 * @description
 * Update the item of type `resourceName` and primary key `id` with `attrs`. This is useful when you want to update an
 * item that isn't already in the data store, or you don't want to update the item that's in the data store until the
 * server-side operation succeeds. This differs from `DS.save` which simply saves items in their current form that
 * already reside in the data store.
 *
 * ## Signature:
 * ```js
 * DS.update(resourceName, id, attrs[, options])
 * ```
 *
 * ## Example:
 *
 * ```js
 *  DS.get('document', 5); // undefined
 *
 *  DS.update('document', 5, { title: 'How to cook in style' })
 *  .then(function (document) {
 *      document; // A reference to the document that's been saved to the server
 *                // and now resides in the data store
 *  });
 * ```
 *
 * @param {string} resourceName The resource type, e.g. 'user', 'comment', etc.
 * @param {string|number} id The primary key of the item to update.
 * @param {object} attrs The attributes with which to update the item.
 * @param {object=} options Optional configuration. Properties:
 * - `{boolean=}` - `cacheResponse` - Inject the data returned by the server into the data store. Default: `true`.
 *
 * @returns {Promise} Promise produced by the `$q` service.
 *
 * ## Resolves with:
 *
 * - `{object}` - `item` - A reference to the newly saved item.
 *
 * ## Rejects with:
 *
 * - `{IllegalArgumentError}`
 * - `{RuntimeError}`
 * - `{UnhandledError}`
 */
function update(resourceName, id, attrs, options) {
	var deferred = this.$q.defer(),
		promise = deferred.promise;

	options = options || {};

	if (!this.definitions[resourceName]) {
		deferred.reject(new this.errors.RuntimeError(errorPrefix + resourceName + ' is not a registered resource!'));
	} else if (!this.utils.isString(id) && !this.utils.isNumber(id)) {
		deferred.reject(new this.errors.IllegalArgumentError(errorPrefix + 'id: Must be a string or a number!'));
	} else if (!this.utils.isObject(attrs)) {
		deferred.reject(new this.errors.IllegalArgumentError(errorPrefix + 'attrs: Must be an object!'));
	} else if (!this.utils.isObject(options)) {
		deferred.reject(new this.errors.IllegalArgumentError(errorPrefix + 'options: Must be an object!'));
	} else {
		var definition = this.definitions[resourceName],
			resource = this.store[resourceName],
			_this = this;

		if (!('cacheResponse' in options)) {
			options.cacheResponse = true;
		} else {
			options.cacheResponse = !!options.cacheResponse;
		}

		promise = promise
			.then(function (attrs) {
				return _this.$q.promisify(definition.beforeValidate)(resourceName, attrs);
			})
			.then(function (attrs) {
				return _this.$q.promisify(definition.validate)(resourceName, attrs);
			})
			.then(function (attrs) {
				return _this.$q.promisify(definition.afterValidate)(resourceName, attrs);
			})
			.then(function (attrs) {
				return _this.$q.promisify(definition.beforeUpdate)(resourceName, attrs);
			})
			.then(function (attrs) {
				return _this.adapters[options.adapter || definition.defaultAdapter].update(definition, id, definition.serialize(resourceName, attrs), options);
			})
			.then(function (res) {
				return _this.$q.promisify(definition.afterUpdate)(resourceName, definition.deserialize(resourceName, res));
			})
			.then(function (data) {
				if (options.cacheResponse) {
					var updated = _this.inject(definition.name, data, options);
					var id = updated[definition.idAttribute];
					resource.previousAttributes[id] = _this.utils.deepMixIn({}, updated);
					resource.saved[id] = _this.utils.updateTimestamp(resource.saved[id]);
					return _this.get(definition.name, id);
				} else {
					return data;
				}
			});

		deferred.resolve(attrs);
	}
	return promise;
}

module.exports = update;
