#!/usr/bin/env bash

cd `dirname $0`
cd ../

docker build -t soconnor/micro-amd .
