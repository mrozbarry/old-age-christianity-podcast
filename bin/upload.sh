#!/bin/sh

scp ./$2/$3 $1:/var/www/dump/$3
ssh $1 chmod 644 /var/www/dump/$3
