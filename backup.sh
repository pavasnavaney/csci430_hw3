#!/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
export DISPLAY=:0.0
aws s3 cp "csci430_hw3/public/uploads/" s3://csci430-backup-bucket --recursive


