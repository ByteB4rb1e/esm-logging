
AC_INIT

AC_CHECK_PROGS([MAKE], [make])
AC_CHECK_PROGS([PYTHON3], [npm])
AC_CHECK_PROGS([AUTOCONF], [autoconf])
AC_CHECK_PROGS([GIT], [git])

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

AC_MSG_NOTICE([initializing npm...])
npm install

AC_OUTPUT
