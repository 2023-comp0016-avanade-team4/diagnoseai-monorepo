"""
Represents a singleton. Credit: https://stackoverflow.com/a/6798042
"""


# This metaclass is excluded from unit tests, because its purpose is
# to create classes with particular properties. It makes more sense to
# spend more effort to test the derivative classes.
# pylint: disable=too-few-public-methods
# pragma: no cover
class Singleton(type):
    """
    Singleton metaclass. Use this metaclass to create a singleton class.
    """
    _instances: dict[object, object] = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).\
                __call__(*args, **kwargs)
        return cls._instances[cls]
