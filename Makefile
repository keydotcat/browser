
zip: release
	yarn run build-zip
	ls dist-zip/KeyCat-$$(git describe  --always --dirty --tags).zip 

clean:
	rm -rf dist/

release: clean
	yarn run build

upload-moz: release
	web-ext sign -s dist --api-key "$${MOZ_API_KEY}" --api-secret "$${MOZ_API_SECRET}"

upload-chrome: zip
	curl -H "Authorization: Bearer $${GOOG_TOKEN}" -H "x-goog-api-version: 2" -X PUT -T dist-zip/KeyCat-$$(git describe  --always --dirty --tags).zip -v  https://www.googleapis.com/chromewebstore/v1.1/items/njolgkicibdplnchcojfmckpcbhgaggg

upload: upload-moz upload-chrome

