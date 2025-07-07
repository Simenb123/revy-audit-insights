#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug() {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky:debug $*"
  }
  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  [ -r ~/.huskyrc ] && . ~/.huskyrc
  export readonly husky_skip_init=1
  sh -e "$(dirname "$0")/../$hook_name" "$@"
  exitCode=$?
  debug "$hook_name finished with exit code $exitCode"
  exit $exitCode
fi
