
AC_INIT

AC_CHECK_PROGS([GIT], [git], [no])
AS_IF([test "$GIT" == "no"], 
      [AC_MSG_ERROR([install Git, before continuing.])])

AC_CHECK_PROGS([NODE], [node], [no])
AS_IF([test "$NODE" == "no"], 
      [AC_MSG_ERROR([install Node.js (node), before continuing.])])

AC_CHECK_PROGS([NPM], [npm], [no])
AS_IF([test "$NPM" == "no"], 
      [AC_MSG_ERROR([install npm, before continuing.])])

AC_CHECK_PROGS([MAKE], [make], [no])
AS_IF([test "$NPM" == "no"], 
      [AC_MSG_ERROR([install GNU Make (make), before continuing.])])

AC_MSG_CHECKING([if 'NPM_REGISTRY' is set])
if ! test -z "$NPM_REGISTRY"; then
    AC_MSG_RESULT([yes])
else
    AC_MSG_RESULT([no])
fi

AC_MSG_CHECKING([if 'NPM_AUTH_TOKEN' is set])
if ! test -z "$NPM_AUTH_TOKEN"; then
    AC_MSG_RESULT([yes])
else
    AC_MSG_RESULT([no])
fi

AC_MSG_NOTICE([showing version info...])
sh -cx "npm --version"
sh -cx "node --version"
sh -cx "git --version"

AC_MSG_NOTICE([initializing npm project...])
npm install

AC_OUTPUT
