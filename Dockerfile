############################################################
# Dockerfile for the building & testing using Grunt.
############################################################

# Set the base image to Debian Wheezy
FROM debian:wheezy

# File Author / Maintainer
MAINTAINER "Séamus O'Connor"

# Update the repository
RUN apt-get update --fix-missing

RUN apt-get upgrade -y

# Get Debian packages
RUN apt-get install -y python g++ make checkinstall fakeroot wget git nginx fontconfig

# Download and Install Node JS
RUN mkdir tmp/node && \
    cd tmp/node && \
    wget -N http://nodejs.org/dist/v0.10.26/node-v0.10.26.tar.gz && \
    tar xzvf node-v0.10.26.tar.gz && \
    cd node-* && \
    ./configure && \
    checkinstall -y --install=no --pkgversion $(echo $(pwd) | sed -n -re's/.+node-v(.+)$/\1/p') make -j$(($(nproc)+1)) install && \
    dpkg -i node_* && \
    rm -rf /tmp/node

# Update NPM
RUN npm -g update npm

# Install global utilities via NPM
RUN npm -g install grunt-cli \
    bower
