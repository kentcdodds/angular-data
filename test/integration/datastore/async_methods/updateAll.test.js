describe('DS.updateAll(resourceName, attrs, params[, options])', function () {
	var errorPrefix = 'DS.updateAll(resourceName, attrs, params[, options]): ';

	beforeEach(startInjector);

	it('should throw an error when method pre-conditions are not met', function () {
		DS.updateAll('does not exist').then(function () {
			fail('should have rejected');
		}, function (err) {
			assert.isTrue(err instanceof DS.errors.RuntimeError);
			assert.equal(err.message, errorPrefix + 'does not exist is not a registered resource!');
		});

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			if (key) {
				DS.updateAll('post', key).then(function () {
					fail('should have rejected');
				}, function (err) {
					assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
					assert.equal(err.message, errorPrefix + 'attrs: Must be an object!');
				});
			}
		});

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			if (key) {
				DS.updateAll('post', {}, key).then(function () {
					fail('should have rejected');
				}, function (err) {
					assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
					assert.equal(err.message, errorPrefix + 'params: Must be an object!');
				});
			}
		});

		angular.forEach(TYPES_EXCEPT_OBJECT, function (key) {
			if (key) {
				DS.updateAll('post', {}, {}, key).then(function () {
					fail('should have rejected');
				}, function (err) {
					assert.isTrue(err instanceof DS.errors.IllegalArgumentError);
					assert.equal(err.message, errorPrefix + 'options: Must be an object!');
				});
			}
		});
	});
	it('should update a collection of items', function () {
		$httpBackend.expectPUT('http://test.angular-cache.com/posts?query=%7B%22where%22:%7B%22age%22:%7B%22%3D%3D%22:33%7D%7D%7D').respond(200, [
			{ author: 'Adam', age: 27, id: 8 },
			{ author: 'Adam', age: 27, id: 9 }
		]);

		var post4 = DS.inject('post', p4),
			post5 = DS.inject('post', p5),
			posts = DS.filter('post', { query: { where: { age: { '==': 33 } } } });

		var initialModified = DS.lastModified('post', 8),
			initialSaved = DS.lastSaved('post', 8);

		DS.updateAll('post', { age: 27 }, { query: { where: { age: { '==': 33 } } } }).then(function (ps) {
			assert.deepEqual(ps, posts, '2 posts should have been updated');
			assert.equal(posts[0].age, 27);
			assert.equal(posts[1].age, 27);
			assert.equal(post4.age, 27);
			assert.equal(post5.age, 27);
		}, function (err) {
			console.error(err.stack);
			fail('should not have rejected');
		});

		$httpBackend.flush();
		$httpBackend.expectPUT('http://test.angular-cache.com/posts?query=%7B%22where%22:%7B%22age%22:%7B%22%3D%3D%22:31%7D%7D%7D').respond(200, [
			{ author: 'Jane', age: 5, id: 6 }
		]);

		assert.equal(lifecycle.beforeUpdate.callCount, 1, 'beforeUpdate should have been called');
		assert.equal(lifecycle.afterUpdate.callCount, 1, 'afterUpdate should have been called');
		assert.deepEqual(DS.filter('post', { query: { where: { age: { '==': 27 } } } }), posts);
		assert.notEqual(DS.lastModified('post', 8), initialModified);
		assert.notEqual(DS.lastSaved('post', 8), initialSaved);

		DS.updateAll('post', { age: 5 }, { query: { where: { age: { '==': 31 } } } }).then(function (ps) {
			assert.deepEqual(ps, DS.filter('post', { query: { where: { age: { '==': 5 } } } }));
			assert.deepEqual(ps[0], { author: 'Jane', age: 5, id: 6 });
		}, function (err) {
			console.error(err.stack);
			fail('should not have rejected');
		});

		$httpBackend.flush();

		assert.equal(lifecycle.beforeInject.callCount, 5, 'beforeInject should have been called');
		assert.equal(lifecycle.afterInject.callCount, 5, 'afterInject should have been called');
		assert.equal(lifecycle.serialize.callCount, 2, 'serialize should have been called');
		assert.equal(lifecycle.deserialize.callCount, 2, 'deserialize should have been called');
	});
});
