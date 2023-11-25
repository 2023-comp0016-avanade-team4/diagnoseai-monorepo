"""
Setup script to help IDEs perform type completion everywhere.

Run pip install -e . in the current directory before continuing.
"""
from setuptools import setup, find_packages  # type: ignore[import-untyped]

setup(name='core', version='0.01', package_data={
    'core': ['py.typed']
}, packages=find_packages())
