#!/usr/bin/env bash

cd `dirname $0`
cd ..

port=8001
projectdir=`pwd`
vmdir=/var/microamd

if [ "$1" ]; then
  port="$1"
fi

echo "Starting grunt dev container"

docker run --rm -w $vmdir -p $port:80 -v $projectdir:$vmdir:rw soconnor/micro-amd bash -c "grunt dev"

