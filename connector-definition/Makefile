.DEFAULT_GOAL := build
SHELL = /usr/bin/env bash

REGISTRY_IMAGE := ghcr.io/singlestore-labs/singlestore-hasura-connector
PACKAGE_VERSION := $(shell node -p "require('../package.json').version")
DOCKER_IMAGE ?= $(REGISTRY_IMAGE):v$(PACKAGE_VERSION)

.PHONY: build
build: dist/connector-definition.tgz

.PHONY: clean
clean:
	rm -rf dist

dist dist/.hasura-connector:
	mkdir dist
	mkdir dist/.hasura-connector

dist/.hasura-connector/connector-metadata.yaml: connector-metadata.yaml dist/.hasura-connector
	cp -f connector-metadata.yaml dist/.hasura-connector/
	sed -i 's|$(REGISTRY_IMAGE)|$(DOCKER_IMAGE)|g' dist/.hasura-connector/connector-metadata.yaml

dist/connector-definition.tgz: dist/.hasura-connector/connector-metadata.yaml
	shopt -s dotglob && cd dist && tar -czvf connector-definition.tgz *
